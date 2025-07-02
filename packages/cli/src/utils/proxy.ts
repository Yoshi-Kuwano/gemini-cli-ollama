/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import process from 'node:process';

/**
 * Determines if a proxy should be used for the given URL based on NO_PROXY environment variables.
 * @param url The URL to check
 * @returns The proxy URL to use, or undefined if no proxy should be used
 */
export function getProxyForUrl(url?: string): string | undefined {
  // Get proxy settings from environment
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || '';

  // If no URL provided or no proxy configured, use default proxy
  if (!url) {
    return httpsProxy || httpProxy;
  }

  // Parse the URL to get hostname
  let hostname: string;
  try {
    const parsedUrl = new URL(url);
    hostname = parsedUrl.hostname;
  } catch {
    // If URL parsing fails, use default proxy
    return httpsProxy || httpProxy;
  }

  // Check if hostname matches any no_proxy patterns
  const noProxyList = noProxy.split(',').map((item) => item.trim());
  for (const pattern of noProxyList) {
    if (!pattern) continue;

    // Check for exact match
    if (hostname === pattern) {
      return undefined;
    }

    // Check for domain suffix match (e.g., .example.com matches sub.example.com)
    if (pattern.startsWith('.') && hostname.endsWith(pattern)) {
      return undefined;
    }

    // Check for domain match without leading dot
    if (
      (!pattern.includes('/') && hostname === pattern) ||
      hostname.endsWith('.' + pattern)
    ) {
      return undefined;
    }

    // Check for localhost variations
    if (
      pattern.toLowerCase() === 'localhost' &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1')
    ) {
      return undefined;
    }

    // Check for IP address ranges (simple check for now)
    if (pattern.includes('/') || pattern.includes('*')) {
      // TODO: Implement CIDR and wildcard matching if needed
      continue;
    }
  }

  // Use proxy for this URL
  return httpsProxy || httpProxy;
}
