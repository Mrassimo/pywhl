# 🔀 Merge Strategy: Making Lightweight the Main Branch

## Recommendation: Replace Main with Lightweight

The lightweight/browser version should be the default because:
- ✅ Works in restricted environments (the main use case)
- ✅ No npm dependencies
- ✅ Browser mode handles all proxy issues
- ✅ Simpler to deploy (just copy files)

## Option 1: Direct Replacement (Recommended)

```bash
# 1. Backup current main (just in case)
git checkout main
git checkout -b main-backup

# 2. Replace main with lightweight
git checkout main
git reset --hard lightweight

# 3. Push the new main
git push --force origin main

# 4. Delete lightweight branch (it's now main)
git branch -d lightweight
git push origin --delete lightweight
```

## Option 2: Merge and Clean

```bash
# 1. Merge lightweight into main
git checkout main
git merge lightweight --strategy=ours

# 2. Reset to lightweight's content
git checkout lightweight -- .

# 3. Commit the change
git commit -m "feat: make lightweight version the default

- Browser mode is now default
- No npm dependencies required
- Direct mode available with --direct flag"

# 4. Push
git push origin main
```

## Post-Merge Cleanup

1. Update GitHub default branch to main
2. Archive the old npm-based version if needed
3. Update any CI/CD pipelines

## New Main Features

After merge, main will have:
- 🌐 Browser mode (default)
- 📦 Direct download mode (--direct flag)
- 🚀 Zero npm dependencies
- 🏢 Corporate proxy friendly

## Testing Checklist

Before merging:
- [ ] Test `pywhl numpy` (browser mode)
- [ ] Test `pywhl --direct requests` (direct mode) 
- [ ] Test `node process-downloads.js`
- [ ] Test on Windows with .bat files
- [ ] Verify no npm dependencies needed

## Communication

After merge, update README to emphasize:
- Browser mode is default (most reliable)
- Direct mode available but may fail with proxies
- No npm install needed - just copy and run