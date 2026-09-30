/**
 * Mesh mode tagging helpers.
 * Sets `data-inspector-source` attributes on DOM elements so the
 * Demo Inspector Chrome extension can detect API Mesh data sources.
 */

/** @type {readonly ['commerce', 'catalog', 'search']} */
const VALID_SOURCES = ['commerce', 'catalog', 'search'];

/**
 * Available API Mesh source identifiers.
 * @readonly
 */
export const SOURCES = /** @type {const} */ ({
  COMMERCE: 'commerce',
  CATALOG: 'catalog',
  SEARCH: 'search',
});

/**
 * Tag a single element as an API Mesh data source.
 *
 * @param {Element} element - The DOM element to tag
 * @param {'commerce' | 'catalog' | 'search'} sourceId - The source identifier
 * @throws {Error} If element is not an Element or sourceId is invalid
 */
export function tagMeshSource(element, sourceId) {
  if (!(element instanceof Element)) {
    throw new Error('tagMeshSource: first argument must be a DOM Element');
  }
  if (!VALID_SOURCES.includes(sourceId)) {
    throw new Error(`tagMeshSource: invalid source "${sourceId}". Must be one of: ${VALID_SOURCES.join(', ')}`);
  }
  element.setAttribute('data-inspector-source', sourceId);
}

/**
 * Tag multiple elements as an API Mesh data source.
 * Accepts a CSS selector string, NodeList, or array of Elements.
 *
 * @param {string | NodeList | Element[]} selectorOrElements - CSS selector or element collection
 * @param {'commerce' | 'catalog' | 'search'} sourceId - The source identifier
 * @throws {Error} If sourceId is invalid
 */
export function tagMeshSources(selectorOrElements, sourceId) {
  if (!VALID_SOURCES.includes(sourceId)) {
    throw new Error(`tagMeshSources: invalid source "${sourceId}". Must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  const elements = typeof selectorOrElements === 'string'
    ? document.querySelectorAll(selectorOrElements)
    : selectorOrElements;

  for (const el of elements) {
    if (el instanceof Element) {
      el.setAttribute('data-inspector-source', sourceId);
    }
  }
}
