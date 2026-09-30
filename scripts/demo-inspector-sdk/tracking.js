/**
 * GraphQL query tracking helpers.
 * Wraps fetchers to measure response time, detect the API Mesh source,
 * and dispatch tracking entries via the Demo Inspector page bridge globals.
 *
 * Two window globals are used (set by the Chrome extension's page bridge):
 *  - `window.__demoInspectorTrackQuery` — receives query metadata for the panel
 *  - `window.__demoInspectorStoreData`  — receives full response data for inspection
 */

/**
 * Detect which API Mesh source a GraphQL response came from.
 *
 * @param {string} queryName - The GraphQL operation name
 * @param {object} data - The response data object
 * @returns {'commerce' | 'catalog' | 'search'}
 */
export function detectSource(queryName, data) {
  if (!data || typeof data !== 'object') {
    return 'commerce';
  }

  // Catalog Service indicators
  if (
    data.Citisignal_productDetail ||
    data.Citisignal_productCards ||
    data.Citisignal_productPageData ||
    data.products ||
    queryName === 'GetProductDetail' ||
    queryName === 'GetProductPageData' ||
    queryName.includes('ProductCards')
  ) {
    return 'catalog';
  }

  // Live Search indicators
  if (
    data.Citisignal_productFacets ||
    data.facets ||
    queryName.includes('Facet') ||
    queryName.includes('Search') ||
    queryName.includes('Filter')
  ) {
    return 'search';
  }

  // Commerce Core indicators
  if (
    data.categories ||
    data.storeConfig ||
    data.navigation ||
    data.breadcrumbs ||
    queryName.includes('Navigation') ||
    queryName.includes('Breadcrumb')
  ) {
    return 'commerce';
  }

  // Default
  return 'commerce';
}

/**
 * Send a query tracking entry to the Demo Inspector extension.
 * No-ops gracefully if the extension's page bridge is not present.
 *
 * Entry format matches the Chrome extension panel's expected shape:
 * `{ id, name, source, timestamp, responseTime }`
 *
 * @param {{ id?: string, name: string, source: string, responseTime: number, timestamp?: number }} entry
 */
export function trackQuery(entry) {
  if (typeof window !== 'undefined' && typeof window.__demoInspectorTrackQuery === 'function') {
    window.__demoInspectorTrackQuery({
      id: entry.id || `${entry.name}-${Date.now()}`,
      name: entry.name,
      source: entry.source,
      timestamp: entry.timestamp || Date.now(),
      responseTime: entry.responseTime,
    });
  }
}

/**
 * Send response data to the Demo Inspector extension for inspection.
 * No-ops gracefully if the extension's page bridge is not present.
 *
 * @param {{ queryName: string, source: string, data: unknown, timestamp?: number }} entry
 */
export function trackData(entry) {
  if (typeof window !== 'undefined' && typeof window.__demoInspectorStoreData === 'function') {
    window.__demoInspectorStoreData({
      queryName: entry.queryName,
      source: entry.source,
      data: entry.data,
      timestamp: entry.timestamp || Date.now(),
    });
  }
}

/**
 * Wrap a GraphQL fetcher with automatic tracking.
 * Measures response time, detects the source, and dispatches to both
 * `trackQuery` and `trackData` globals.
 *
 * @param {Function} baseFetcher - (query, variables, options) => Promise<object>
 * @returns {Function} Wrapped fetcher with identical signature plus tracking options
 *
 * @example
 * const tracked = wrapFetcher(myFetcher);
 * const data = await tracked('query GetNav { navigation }', {});
 * // skip tracking for a specific call:
 * const data2 = await tracked('query Test { test }', {}, { skipTracking: true });
 * // override detected source:
 * const data3 = await tracked(q, vars, { source: 'catalog' });
 */
export function wrapFetcher(baseFetcher) {
  return async (query, variables, options) => {
    const nameMatch = query.match(/query\s+(\w+)/);
    const queryName = nameMatch ? nameMatch[1] : 'Anonymous';

    const start = performance.now();
    const result = await baseFetcher(query, variables, options);
    const responseTime = Math.round(performance.now() - start);

    if (!options?.skipTracking) {
      const source = options?.source || detectSource(queryName, result);
      const timestamp = Date.now();

      trackQuery({
        id: `${queryName}-${timestamp}`,
        name: queryName,
        source,
        responseTime,
        timestamp,
      });

      trackData({
        queryName,
        source,
        data: result,
        timestamp,
      });
    }

    return result;
  };
}
