# Hero

Full-width banner block that renders an optional background image with an overlaid heading and supporting content.

## Purpose
Displays a prominent above-the-fold banner at the top of a page. The first `<picture>` in the block is positioned as a full-bleed background; headings, paragraphs, and a call-to-action link render on top.

## Authoring
- Row 1: optional background image (as a picture/image) and/or an `h1` heading.
- Add supporting copy as paragraphs and a standalone link (auto-decorated into a button) for the CTA.

## Variants
- `cs-hero` — ComplianceSigns demo styling: navy gradient background, condensed display heading, and an orange call-to-action button. Used on the homepage hero. No background image required (the navy gradient is applied via CSS).

## Behavior
- No JavaScript; the block is styled entirely via `hero.css`.
- Background pictures are positioned absolutely behind the text content.

## Notes
- Colors and the display typeface come from the global `--cs-*` brand tokens defined in `styles/styles.css`.
