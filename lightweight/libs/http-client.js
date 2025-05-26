// Lightweight HTTP client to replace 'got'
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { URL } from 'url';

export async function get(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'pywhl-lightweight/0.1.0',
        ...options.headers
      }
    };

    const req = requestFn(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve({
              body: data,
              json: () => json,
              statusCode: res.statusCode,
              headers: res.headers
            });
          } catch {
            resolve({
              body: data,
              text: () => data,
              statusCode: res.statusCode,
              headers: res.headers
            });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

export async function downloadFile(url, writeStream) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'pywhl-lightweight/0.1.0'
      }
    };

    const req = requestFn(requestOptions, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      } else {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
    });
    
    req.on('error', reject);
    req.end();
  });
}