# Footer

Loads the `/footer` fragment and renders it as the site footer. When the store is multi-store, it also renders a store-view switcher modal.

## Purpose
Provides the global site footer: brand/logo, address, link columns, and legal/utility links, sourced from the authored `/footer` document.

## Authoring
Author footer content in the `/footer` DA document. Typical structure:
- A `columns` block for the logo/address plus the link columns (e.g. About Our Company, Your Account, Support, Stay In Touch).
- A trailing default-content section for the copyright and legal links.

## Integration
- Fragment path resolves from the `footer` metadata value, defaulting to `/footer`.
- Store-view switcher renders only when the project is configured as multi-store (`isMultistore()`), using the `/store-switcher` fragment.

## Styling
- `footer.css` provides the base layout and the ComplianceSigns demo brand restyle (navy background, condensed uppercase column headers, orange link hover). Brand colors come from the global `--cs-*` tokens.

## Behavior
- Footer content is loaded lazily as part of the page's lazy phase.
- Store switcher opens in a modal built via the `modal` block.
