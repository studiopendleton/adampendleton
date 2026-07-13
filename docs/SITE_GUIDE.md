# Site Guide

This repo is a Kirby CMS site for `adampendleton.net`. Kirby is a file-based PHP CMS: PHP templates and CSS/JS define the site behavior, while editable page content, uploaded media metadata, users, sessions, and the Kirby license live in local files on the server.

## What This Repo Contains

- `index.php` boots Kirby and renders the current request.
- `kirby/` is the vendored Kirby CMS core. This checkout contains Kirby `4.4.1`, which requires PHP `8.1`, `8.2`, or `8.3`.
- `site/config/config.php` is the site-level Kirby config.
- `site/templates/` contains page templates.
- `site/snippets/` contains reusable PHP fragments used by templates.
- `site/blueprints/` controls the Kirby Panel editing UI and defines available fields.
- `site/plugins/` contains Kirby Panel/site plugins:
  - `kirby-colors`
  - `kirby-plugin-image-crop-field`
  - `kirby-fingerprint-master`
  - `k3-whenquery`
- `assets/css/`, `assets/js/`, `assets/fonts/`, and `assets/svg/` are public front-end assets.

## What Is Not In Git

The clone is not a complete copy of the live site state. `.gitignore` excludes:

- `content/*`: Kirby page content, site fields, file metadata, and uploaded content references.
- `/media/*`: generated public media cache.
- `/site/accounts/*`: Kirby Panel users.
- `/site/sessions/*`: sessions.
- `/site/cache/*`: cache.
- `/site/config/.license`: Kirby license.

That is correct from a security and repo-size perspective, but it means a fresh clone cannot accurately render the real site until you also get a local copy of the server's `content/` folder and required uploaded files.

## Rendering Flow

1. A browser request hits `index.php`.
2. Kirby reads the matching page from `content/`.
3. Kirby chooses a template based on the page template/content file.
4. The template includes shared snippets and outputs HTML.
5. `site/snippets/header.php` loads:
   - `assets/fonts/fonts.css`
   - `assets/css/global.css`
   - the matching auto stylesheet, e.g. `assets/css/templates/image.css`
   - jQuery from CDN
   - the matching auto JS file, e.g. `assets/js/templates/image.js`
6. `site/snippets/footer.php` closes the page and prints Panel-managed footer text.

## Main Page Types

- Home: `site/templates/home.php`
  - Renders site-level `mainText` blocks from the Kirby Panel.
  - Each block gets a minimum height from the site-level `frameHeight` setting.
  - Main appearance settings are defined in `site/blueprints/site.yml`.

- Image page: `site/templates/image.php`
  - Renders `gallery_images` as a Flickity carousel.
  - Uses `assets/css/templates/image.css`.
  - Uses `assets/js/templates/image.js`, which contains the bundled Flickity code.

- Video page: `site/templates/video.php`
  - Renders the page's first uploaded video file in a native HTML `<video>` element.
  - Uses `assets/css/templates/video.css`.

- Default page: `site/templates/default.php`
  - Bare fallback template.

## Site-Wide Settings

The Kirby Panel site blueprint at `site/blueprints/site.yml` defines most editable global settings:

- Home page text blocks.
- Minimum paragraph frame height.
- Footer text.
- Desktop and mobile background images.
- Background image position.
- Body text color.
- Hover/background color.
- Desktop and mobile font sizing.
- Text blend toggle.

Those settings are read in `site/snippets/header.php` and converted to CSS custom properties such as `--body-color`, `--font-size`, and `--background-image`.

## Local Setup

Install PHP `8.1`, `8.2`, or `8.3`. Verify with `php -v`.

On macOS with Homebrew, PHP `8.3` is the safest current target for this Kirby core:

```sh
brew install php@8.3
```

Then get a local copy of the server content. Ask the developer or server admin for a safe sync of:

```text
content/
site/config/.license
```

Do not commit those paths.

If you also need local Panel login, you need a local-safe copy of `site/accounts/`, or you can create a local-only Panel user after the site boots. Do not commit `site/accounts/`.

Start the local server from the repo root:

```sh
php -S localhost:8000 kirby/router.php
```

Open:

```text
http://localhost:8000
http://localhost:8000/panel
```

## Making Changes

Use this rule of thumb:

- Global layout, typography, colors, spacing: edit `assets/css/global.css`.
- Template-specific styling: edit `assets/css/templates/*.css`.
- Shared `<head>`, CSS variables, analytics, global asset loading: edit `site/snippets/header.php`.
- Shared footer: edit `site/snippets/footer.php`.
- Home markup: edit `site/templates/home.php`.
- Image carousel markup/behavior: edit `site/templates/image.php`, `assets/css/templates/image.css`, or `assets/js/templates/image.js`.
- Video markup/behavior: edit `site/templates/video.php` or `assets/css/templates/video.css`.
- Kirby Panel editing fields: edit `site/blueprints/**/*.yml`.
- Actual page text, uploaded images, image captions, and site settings: edit through the Kirby Panel or files under `content/`, not through the PHP templates.

Recommended workflow:

```sh
git status
git pull --ff-only
git switch -c your-change-name
php -S localhost:8000 kirby/router.php
```

Make edits, test locally, then:

```sh
git status
git diff
git add path/to/changed-files
git commit -m "Describe the change"
git push origin your-change-name
```

## Deployment Reality

The current README says GitHub is a mirror and that changes are pushed from the server to GitHub via a `post-receive` hook. That means pushing to GitHub probably does not deploy the live site by itself.

To deploy from this machine, choose one clear source of truth:

1. Keep the server as source of truth.
   - Get SSH access to the droplet.
   - Add the server's deploy repository as a Git remote.
   - Push directly to that deploy remote/branch.
   - The existing server hook deploys the pushed commit.

2. Make GitHub the source of truth.
   - Change the server hook/process so the droplet pulls from GitHub or is updated by GitHub Actions.
   - Push local branches to GitHub and deploy from there.

3. Manual fallback.
   - SSH to the droplet.
   - Pull or checkout the intended commit in the server repo.
   - Clear Kirby cache if needed.

Before deploying, confirm with the developer:

- The droplet SSH hostname and username.
- The path to the live site.
- The path to the bare/deploy Git repo, if separate.
- Which branch deploys.
- Whether the hook deploys automatically on push.
- Whether GitHub is only a mirror or should become canonical.

## Notes And Risks

- The root `composer.json` still describes Kirby Plainkit with `getkirby/cms:^3.0`, but the vendored `kirby/` directory is Kirby `4.4.1`. Do not run dependency updates until that mismatch is intentionally resolved.
- `site/config/config.php` has `debug` set to `false`, which is correct for production. For local debugging, use a machine-specific config override rather than committing production debug changes.
- `site/snippets/header.php` assumes the site has desktop/mobile background image files. A local `content/` copy needs those files or the header can error.
- `site/snippets/header.php` currently assigns the background image focus to a single variable and uses it for both `--background-focus-x` and `--background-focus-y`. If you rely on per-axis focus in CSS, confirm what `$file->focus()` returns and adjust accordingly.
- The Google Analytics script loads on local pages too. That may be acceptable for visual testing, but use a local-only config if you want to disable analytics during development. Also note the current `header.php` loads `gtag.js?id=UA-147761494-1` but configures `UA-19147768-1`; confirm which property ID is actually intended before making analytics changes.
