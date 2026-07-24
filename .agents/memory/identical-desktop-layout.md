---
    name: Identical desktop layout across breakpoints
    description: How mobile/tablet responsive overrides were disabled site-wide to force desktop-identical layout
    ---

    The user explicitly asked (twice, after being warned about tradeoffs) to make mobile/tablet views pixel-identical to desktop, not just visually similar.

    **Approach used:** rather than deleting each `@media (max-width: ...)` block individually, rewrote every such media condition to `@media (min-width: 99999px)` in both css/style.css and css/enhancements.css — an impossible condition on real devices, so the block's CSS never applies and only base (desktop) styles remain active at any viewport width. This preserves brace structure/line numbers and is easy to reverse (search for `min-width: 99999px` to find every neutralized rule).

    **Why:** literal deletion risks brace mismatches across large files; a never-matching condition is a safe, reversible way to "soft-disable" a block.

    **What was intentionally left alone:** JS touch/interaction fallbacks gated by `window.innerWidth <= 768` (e.g. tap-to-open video on mobile, skip-scroll-pin-animation on mobile) were NOT removed, since touch devices have no hover and removing them would break core interactions (users unable to open the video) rather than just changing appearance. Only true CSS layout/style differences were unified.

    **How to apply:** if the user later wants responsive behavior back, search both CSS files for `@media (min-width: 99999px)` and restore the original max-width values (they were: 768px, 900px, 1024px, 480px, 600px, 500px, 680px, 1100px, and one compound `(max-width: 900px) and (min-width: 769px)` in style.css line ~538).
    