import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';
import {
  loadCommerceEager,
  loadCommerceLazy,
  initializeCommerce,
  applyTemplates,
  decorateLinks,
  loadErrorPage,
  decorateSections,
  IS_UE,
  IS_DA,
} from './commerce.js';

/*
 * Trusted Types default policy.
 *
 * This policy is defined but NOT currently enforced: the
 * `require-trusted-types-for 'script'` CSP directive that activates it has been
 * removed from the Content-Security-Policy meta in head.html. The policy is kept
 * here so enforcement can be turned back on without re-authoring it.
 *
 * Why the directive was removed: with it enforced, payment SDKs that build a
 * same-origin iframe and synchronously inject a <script> into it fail to render.
 * The Credit Card checkout flow hits this because its hosted-fields SDK does
 * exactly that. Trusted Types policies are scoped per document/realm, so the
 * child iframe inherits the CSP directive but not this default policy; the SDK's
 * `script.src` assignment in that realm then throws "This document requires
 * 'TrustedScriptURL' assignment" and the card fields never mount. Any dependency
 * that injects scripts into a same-origin iframe realm hits the same wall.
 *
 * To re-enable enforcement: add `require-trusted-types-for 'script';` back to the
 * `Content-Security-Policy` meta in head.html. Before doing so, note that the
 * policy below is a passthrough (createScriptURL/createScript return their input
 * unchanged), so enforcing it satisfies the API without adding real containment;
 * hardening it into an allowlist is the useful next step. Enforcement will also
 * re-break any same-origin-iframe SDK unless that SDK installs its own policy in
 * the iframe realm (the correct long-term fix).
 *
 * References:
 * - Directive introduced upstream: https://github.com/adobe/aem-boilerplate/pull/641
 * - Trusted Types API: https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
 */
if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
/**
 * Activate the boilerplate's authored column layout (Demo Builder thin-layer patch).
 * The account page authors a 30%/70% split via Section Metadata (data-column-width),
 * but the boilerplate only lays sections into a row when body.columns is set and each
 * section carries the --column-width var, and nothing translates the authored attribute.
 * Feed data-column-width into --column-width and switch on body.columns so the existing
 * `body.columns main > .section { flex-basis: var(--column-width) }` rule renders the
 * sidebar layout (mobile stacks below 900px). Layout only - no styling.
 */
function decorateColumnSections(main) {
  const columns = main.querySelectorAll(':scope > .section[data-column-width]');
  if (!columns.length) return;
  columns.forEach((section) => {
    section.style.setProperty('--column-width', section.dataset.columnWidth);
  });
  document.body.classList.add('columns');
}

export function decorateMain(main) {
  decorateLinks(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateColumnSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  const main = doc.querySelector('main');
  if (main) {
    try {
      await initializeCommerce();
      decorateMain(main);
      applyTemplates(doc);
      await loadCommerceEager();
    } catch (e) {
      console.error('Error initializing commerce configuration:', e);
      loadErrorPage(418);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), (section) => {
      // === Quick Edit first-paint guard (Demo Builder) ===
      // The Experience Workspace canvas stalls the first paint if loadSection
      // blocks on waitForFirstImage in quick-edit mode; skip the wait there.
      if (document.body.classList.contains('quick-edit')) return Promise.resolve();
      return waitForFirstImage(section);
    });
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  // === Quick Edit Sidekick listener (Demo Builder) ===
  const loadQuickEdit = async (...args) => {
    // eslint-disable-next-line import/no-cycle
    const { default: initQuickEdit } = await import('../tools/quick-edit/quick-edit.js');
    initQuickEdit(...args);
  };
  const addQuickEditSidekickListeners = (sk) => {
    sk.addEventListener('custom:quick-edit', loadQuickEdit);
  };
  const quickEditSidekick = document.querySelector('aem-sidekick');
  if (quickEditSidekick) {
    addQuickEditSidekickListeners(quickEditSidekick);
  } else {
    document.addEventListener('sidekick-ready', () => {
      addQuickEditSidekickListeners(document.querySelector('aem-sidekick'));
    }, { once: true });
  }
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCommerceLazy();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

export async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

// UE Editor support before page load
if (IS_UE) {
  // eslint-disable-next-line import/no-unresolved
  await import(`${window.hlx.codeBasePath}/scripts/ue.js`).then(({ default: ue }) => ue());
}

loadPage();

// === Quick Edit dynamic import (Demo Builder) ===
(() => {
  const hasQE = new URL(window.location.href).searchParams.has('quick-edit');
  // eslint-disable-next-line import/no-cycle
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
})();
// === end Quick Edit dynamic import ===

(async function loadDa() {
  if (!IS_DA) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
