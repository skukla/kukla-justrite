/**
 * Default tagging rules for EDS storefronts using Commerce dropins.
 *
 * Level 1 maps block names to their primary API Mesh data source.
 * Level 2 maps CSS selectors (scoped within a block) to sub-element sources.
 *
 * These rules cover standard Commerce dropin patterns shared by all EDS
 * storefronts. Package-specific overrides (e.g. custom block names) are
 * provided by the builder and merged at runtime via `mergeRules()`.
 */

export const DEFAULT_RULES = {
  level1: {
    'product-details': 'catalog',
    'product-teaser': 'catalog',
    'product-recommendations': 'catalog',
    'product-list-page': 'search',
    'search': 'search',
    'header': 'commerce',
    'footer': 'commerce',
  },
  level2: {
    'product-details': [
      { selector: '.product-details__gallery', source: 'catalog' },
      { selector: '.product-details__price', source: 'catalog' },
      { selector: '.product-details__short-description', source: 'catalog' },
      { selector: '.product-details__options', source: 'catalog' },
      { selector: '.product-details__buttons__add-to-cart', source: 'commerce' },
      { selector: '.product-details__description', source: 'catalog' },
      { selector: '.product-details__attributes', source: 'catalog' },
    ],
    'product-teaser': [
      { selector: '.image', source: 'catalog' },
      { selector: 'h1', source: 'catalog' },
      { selector: '.price', source: 'catalog' },
      { selector: '.add-to-cart', source: 'commerce' },
    ],
    'product-recommendations': [
      { selector: '.recommendations__list', source: 'catalog' },
    ],
    'header': [
      { selector: '.nav-search-input', source: 'search' },
      { selector: '.nav-cart-button', source: 'commerce' },
      { selector: '.minicart-panel', source: 'commerce' },
    ],
  },
};

/**
 * Merge default rules with package-specific overrides.
 *
 * Level 1 entries are additive — overrides add or replace block-name mappings.
 * Level 2 entries are additive per block — overrides append new selectors.
 *
 * @param {{ level1: Object, level2: Object }} defaults - Base rule set
 * @param {{ level1?: Object, level2?: Object }} [overrides] - Package overrides
 * @returns {{ level1: Object, level2: Object }} Merged rules
 */
export function mergeRules(defaults, overrides) {
  if (!overrides) return defaults;

  const merged = {
    level1: { ...defaults.level1 },
    level2: {},
  };

  for (const [blockName, rules] of Object.entries(defaults.level2)) {
    merged.level2[blockName] = [...rules];
  }

  if (overrides.level1) {
    Object.assign(merged.level1, overrides.level1);
  }

  if (overrides.level2) {
    for (const [blockName, rules] of Object.entries(overrides.level2)) {
      merged.level2[blockName] = [
        ...(merged.level2[blockName] || []),
        ...rules,
      ];
    }
  }

  return merged;
}
