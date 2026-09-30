/**
 * @demo-inspector/sdk — public API.
 *
 * Tag storefront DOM elements for the Demo Inspector Chrome extension.
 */

// Mesh mode
export { tagMeshSource, tagMeshSources, SOURCES } from './mesh.js';

// EDS mode
export { tagBlock, tagSlot } from './eds.js';

// GraphQL tracking
export { wrapFetcher, trackQuery, trackData, detectSource } from './tracking.js';

// Rules
export { DEFAULT_RULES, mergeRules } from './rules.js';
