# Baseline Capture

Captured from local Kirby at `http://localhost:8000` on 2026-06-03 using PHP `8.3.31`.

## Screenshots And Video

- Homepage desktop: `home-desktop-1440x1000.png`
- Homepage mobile: `home-mobile-390x844.png`
- Homepage scroll states: `home-desktop-scroll-*.png`, `home-mobile-scroll-*.png`
- Image page desktop: `image-desktop-1440x1000.png`
- Image page mobile: `image-mobile-390x844.png`
- Image carousel states: `image-*-carousel-*.png`
- Scripted behavior report: `behavior-report.json`
- Homepage scroll video: `page@fe6e03e97a894062f8be260256a5678d.webm`

## Behavior Notes

- Homepage paragraphs/lists are sticky with `top: var(--margin)` inside `100vh` text blocks.
- Desktop `/image` has half-screen `.previous` and `.next` click zones with custom SVG cursors.
- Mobile `/image` hides `.previous` and `.next` via the `max-width: 1024px` media query.
- Keyboard arrows are wired to Flickity previous/next behavior.
- The copied live `/image` page currently renders one carousel cell because only one of the six filenames in `content/image/image.txt` exists locally.

## Content Inventory Summary

- `content/site.txt`: 4 visible `mainText` blocks, `frameHeight: 100`, desktop font size `3rem`, mobile scale `0.5`, blend enabled.
- `content/home/home.txt`: title plus legacy media/autoplay/loop fields only.
- `content/image/image.txt`: 6 gallery references, 1 resolvable locally.
- `content/image/*.jpg.txt`: 51 metadata files, all with captions, 10 with non-empty `Work-description` values.
