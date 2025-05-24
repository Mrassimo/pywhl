const vscode = require('vscode');
const { execaCommand } = require('execa');
const path = require('path');
const fs = require('fs').promises;

let outputChannel;
let statusBarItem;

function activate(context) {
    console.log('Pywhl extension is now active!');
    
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('Pywhl');
    
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'pywhl.showCache';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('pywhl.downloadPackage', downloadPackage),
        vscode.commands.registerCommand('pywhl.searchPackage', searchPackage),
        vscode.commands.registerCommand('pywhl.createBundle', createBundle),
        vscode.commands.registerCommand('pywhl.showCache', showCache),
        vscode.commands.registerCommand('pywhl.configureRepositories', configureRepositories),
        vscode.commands.registerCommand('pywhl.downloadFromRequirements', downloadFromRequirements)
    );

    // Register tree data providers
    const packageProvider = new PackageTreeDataProvider();
    vscode.window.registerTreeDataProvider('pywhlPackages', packageProvider);
    
    const repoProvider = new RepositoryTreeDataProvider();
    vscode.window.registerTreeDataProvider('pywhlRepositories', repoProvider);
}

async function downloadPackage() {
    const packageName = await vscode.window.showInputBox({
        prompt: 'Enter package name (e.g., numpy or numpy==1.24.0)',
        placeHolder: 'package-name'
    });

    if (!packageName) return;

    const options = await vscode.window.showQuickPick([
        { label: 'Download only', value: '' },
        { label: 'Download with dependencies', value: '--deps' }
    ], { placeHolder: 'Select download option' });

    if (!options) return;

    const config = vscode.workspace.getConfiguration('pywhl');
    const pythonVersion = config.get('pythonVersion');
    const outputDir = config.get('outputDirectory');
    const parallel = config.get('parallelDownloads');

    await runPywhlCommand(
        `download ${packageName} ${options.value} -p ${pythonVersion} -o ${outputDir} --parallel ${parallel}`,
        'Downloading package...'
    );
}

async function searchPackage() {
    const query = await vscode.window.showInputBox({
        prompt: 'Search for Python package',
        placeHolder: 'package name'
    });

    if (!query) return;

    await runPywhlCommand(`search ${query}`, 'Searching...');
}

async function createBundle() {
    const packages = await vscode.window.showInputBox({
        prompt: 'Enter packages to bundle (space-separated)',
        placeHolder: 'numpy pandas matplotlib'
    });

    if (!packages) return;

    const outputFile = await vscode.window.showInputBox({
        prompt: 'Bundle output filename',
        value: 'offline-bundle.zip'
    });

    if (!outputFile) return;

    await runPywhlCommand(
        `bundle ${packages} -o ${outputFile}`,
        'Creating bundle...'
    );
}

async function showCache() {
    await runPywhlCommand('cache list', 'Loading cache...');
}

async function configureRepositories() {
    const action = await vscode.window.showQuickPick([
        { label: 'List repositories', value: 'list' },
        { label: 'Add repository', value: 'add' },
        { label: 'Remove repository', value: 'remove' },
        { label: 'Test repository', value: 'test' }
    ], { placeHolder: 'Select action' });

    if (!action) return;

    switch (action.value) {
        case 'list':
            await runPywhlCommand('repo list');
            break;
        case 'add':
            const name = await vscode.window.showInputBox({ prompt: 'Repository name' });
            if (!name) return;
            const url = await vscode.window.showInputBox({ prompt: 'Repository URL' });
            if (!url) return;
            await runPywhlCommand(`repo add ${name} ${url}`);
            break;
        case 'remove':
            const repoName = await vscode.window.showInputBox({ prompt: 'Repository name to remove' });
            if (!repoName) return;
            await runPywhlCommand(`repo remove ${repoName}`);
            break;
        case 'test':
            const testRepo = await vscode.window.showInputBox({ prompt: 'Repository name to test' });
            if (!testRepo) return;
            await runPywhlCommand(`repo test ${testRepo}`);
            break;
    }
}

async function downloadFromRequirements(uri) {
    const filePath = uri ? uri.fsPath : vscode.window.activeTextEditor?.document.uri.fsPath;
    
    if (!filePath || !filePath.endsWith('requirements.txt')) {
        vscode.window.showErrorMessage('Please select a requirements.txt file');
        return;
    }

    const config = vscode.workspace.getConfiguration('pywhl');
    const pythonVersion = config.get('pythonVersion');
    const outputDir = config.get('outputDirectory');
    const parallel = config.get('parallelDownloads');

    await runPywhlCommand(
        `download -r ${filePath} -p ${pythonVersion} -o ${outputDir} --parallel ${parallel}`,
        'Downloading from requirements.txt...'
    );
}

async function runPywhlCommand(command, message = 'Running pywhl...') {
    const config = vscode.workspace.getConfiguration('pywhl');
    const cliPath = config.get('cliPath', 'pywhl');
    
    outputChannel.clear();
    outputChannel.show();
    
    const statusMessage = vscode.window.setStatusBarMessage(`$(sync~spin) ${message}`);
    
    try {
        outputChannel.appendLine(`> ${cliPath} ${command}\n`);
        
        const { stdout, stderr } = await execaCommand(`${cliPath} ${command}`, {
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            shell: true
        });
        
        if (stdout) outputChannel.appendLine(stdout);
        if (stderr) outputChannel.appendLine(stderr);
        
        vscode.window.showInformationMessage('Pywhl command completed successfully');
    } catch (error) {
        outputChannel.appendLine(`Error: ${error.message}`);
        vscode.window.showErrorMessage(`Pywhl command failed: ${error.message}`);
    } finally {
        statusMessage.dispose();
        updateStatusBar();
    }
}

function updateStatusBar() {
    statusBarItem.text = '$(package) Pywhl';
    statusBarItem.tooltip = 'Click to show wheel cache';
    statusBarItem.show();
}

class PackageTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!element) {
            // Get root items (downloaded packages)
            const config = vscode.workspace.getConfiguration('pywhl');
            const outputDir = config.get('outputDirectory', './wheels');
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            
            if (!workspaceRoot) return [];
            
            const wheelsPath = path.join(workspaceRoot, outputDir);
            
            try {
                const files = await fs.readdir(wheelsPath);
                return files
                    .filter(f => f.endsWith('.whl'))
                    .map(f => new PackageItem(f, wheelsPath));
            } catch {
                return [];
            }
        }
        return [];
    }
}

class PackageItem extends vscode.TreeItem {
    constructor(filename, dirPath) {
        super(filename, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${filename}`;
        this.contextValue = 'package';
        this.resourceUri = vscode.Uri.file(path.join(dirPath, filename));
    }
}

class RepositoryTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!element) {
            // This would normally call the CLI to get repositories
            // For now, return mock data
            return [
                new RepositoryItem('pypi', 'https://pypi.org/simple/', true),
                new RepositoryItem('private', 'https://private.repo/simple/', false)
            ];
        }
        return [];
    }
}

class RepositoryItem extends vscode.TreeItem {
    constructor(name, url, isDefault) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.tooltip = url;
        this.description = isDefault ? '(default)' : '';
        this.contextValue = 'repository';
        this.iconPath = new vscode.ThemeIcon('remote');
    }
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};