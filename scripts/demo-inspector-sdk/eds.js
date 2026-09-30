/**
 * EDS mode tagging helpers.
 * Sets `data-block-name`, `data-slot`, and `data-slot-key` attributes
 * so the Demo Inspector Chrome extension can detect EDS structures.
 */

/**
 * Tag an element as an EDS block.
 *
 * @param {Element} element - The DOM element to tag
 * @param {string} name - The block name (e.g. 'hero', 'cards')
 * @throws {Error} If element is not an Element or name is empty
 */
export function tagBlock(element, name) {
  if (!(element instanceof Element)) {
    throw new Error('tagBlock: first argument must be a DOM Element');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('tagBlock: name must be a non-empty string');
  }
  element.setAttribute('data-block-name', name);
}

/**
 * Tag an element as an EDS slot.
 * Uses `data-slot` by default, or `data-slot-key` when `options.useKey` is true.
 *
 * @param {Element} element - The DOM element to tag
 * @param {string} name - The slot name or key
 * @param {{ useKey?: boolean }} [options] - Options
 * @throws {Error} If element is not an Element or name is empty
 */
export function tagSlot(element, name, options) {
  if (!(element instanceof Element)) {
    throw new Error('tagSlot: first argument must be a DOM Element');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('tagSlot: name must be a non-empty string');
  }
  const attr = options?.useKey ? 'data-slot-key' : 'data-slot';
  element.setAttribute(attr, name);
}
