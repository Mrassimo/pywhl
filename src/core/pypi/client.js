import got from 'got';
import { URL } from 'url';

const DEFAULT_PYPI_URL = 'https://pypi.org/pypi';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const USER_AGENT = 'pywhl-cli/0.1.0';

export class PyPIClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_PYPI_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.client = got.extend({
      timeout: {
        request: this.timeout
      },
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      retry: {
        limit: 3,
        methods: ['GET']
      }
    });
  }

  async getPackageInfo(packageName, version = null) {
    try {
      const url = version 
        ? `${this.baseUrl}/${packageName}/${version}/json`
        : `${this.baseUrl}/${packageName}/json`;
      
      const response = await this.client.get(url).json();
      return response;
    } catch (error) {
      if (error.response?.statusCode === 404) {
        throw new Error(`Package '${packageName}' not found on PyPI`);
      }
      throw new Error(`Failed to fetch package info: ${error.message}`);
    }
  }

  async searchPackages(query, limit = 10) {
    try {
      // PyPI search API is different from the JSON API
      const searchUrl = 'https://pypi.org/search/';
      const response = await this.client.get(searchUrl, {
        searchParams: {
          q: query,
          o: '-created' // Order by newest first
        }
      }).text();
      
      // For MVP, we'll return a simple message
      // Full HTML parsing would be implemented in a future phase
      return {
        message: `Search functionality will be enhanced in Phase 2. Use 'pywhl download <package-name>' for direct downloads.`,
        query
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getPackageReleases(packageName) {
    try {
      const info = await this.getPackageInfo(packageName);
      return Object.keys(info.releases || {}).sort((a, b) => {
        // Sort versions in descending order
        return b.localeCompare(a, undefined, { numeric: true });
      });
    } catch (error) {
      throw new Error(`Failed to get releases: ${error.message}`);
    }
  }
}