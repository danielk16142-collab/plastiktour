# Johnston & Daniel — Reimagined (Wix Headless Demo)

An outreach concept demo: a bolder, more contemporary redesign of Johnston & Daniel's
site, built on Wix's managed headless stack (Astro + Wix CLI) with real content coming
from the Wix CMS (Content Manager) instead of hardcoded data.

This folder is **not** a runnable project by itself. It's an overlay: the `src/`
tree below drops into a real Wix headless project that only the Wix CLI can create
(the CLI provisions an actual Wix business and site, which needs your own Wix login —
something that can't be done from this sandbox). Everything else (design, copy, CMS
schema, seed data) is finished and ready to go.

## What's here

```
src/
  pages/
    index.astro          Home
    listings.astro        Listings (grid + status filter)
    listings/[id].astro   Listing detail page
    team.astro             Team grid
  layouts/Layout.astro     Shared <head>, nav, footer, scroll-reveal script
  components/              Nav, Footer, ListingCard, TeamCard, StatBar, Testimonial
  styles/global.css        Brand variables (colors, fonts) — see the guide at the top
  lib/cms.ts               Reads the Listings/Team CMS collections, with sample-data
                            fallback so pages render even before the CMS is populated
scripts/seed-cms.mjs       One-time script to bulk-insert the sample listings/team data
```

I type-checked all of the above in an isolated Astro project (no Wix connection needed
for that) to catch syntax and prop errors ahead of time. I could not run the real
`wix dev` / `wix release` against a live Wix backend myself — this sandbox's network
policy blocks all `wix.com` domains outbound, which is also why I couldn't run the
scaffolding command below for you. Everything past that point needs to run on a machine
with normal internet access (yours).

## Step 1 — Scaffold the real project

On your own machine, with Node.js 20.11+ and Git installed:

```bash
npm create @wix/new@latest -- headless --folder-name jd-reimagined --business-name "J&D Concept Demo" --site-template
```

- `--folder-name` is the local folder it creates.
- `--business-name` is the label you'll see in your Wix account's site list.
- Bare `--site-template` (no value) starts from Wix's blank Astro starter, which is
  the right base for this — we're replacing its pages entirely.

The command signs you in (opens a browser, or use `npm create @wix/new@latest -- headless --help`
to see a non-interactive login flag if you'd rather not use a browser), provisions a
new Wix business + site, installs dependencies, and publishes a placeholder live URL.

## Step 2 — Drop in the design

Copy this folder's `src/` directory into the project the command just created,
overwriting its placeholder `src/`:

```bash
cd jd-reimagined
rm -rf src
cp -r /path/to/this/demos/johnston-daniel-headless/src ./src
npm install @wix/data
```

(`@wix/sdk` is already a dependency of every Wix headless project, so you only need
to add `@wix/data` for the CMS queries.)

## Step 3 — Create the CMS collections

In your project's Wix Dashboard (the command in Step 1 prints a Dashboard link, or
open the site from wix.com/my-account), go to **CMS** (Content Manager) → **Create
Collection**, and create these two. For each field, set the **field name exactly as
shown** below — since the name has no spaces, Wix uses it as the field key too, which
is what the code expects.

Photo fields are stored as plain **Text** fields holding an image URL rather than
native Image fields. That keeps setup to typing/pasting a URL, no Media Manager
upload step required. When you have real, licensed photography, switching a field to
a native Image type later is a one-line change in `src/lib/cms.ts` (the `resolveImage`
helper already supports both).

### Listings collection (ID: `Listings`)

| Field name    | Type   | Notes                                             |
| ------------- | ------ | -------------------------------------------------- |
| `title`       | Text   | e.g. "The Rosedale Estate"                          |
| `address`     | Text   |                                                     |
| `price`       | Number |                                                     |
| `beds`        | Number |                                                     |
| `baths`       | Number |                                                     |
| `sqft`        | Number |                                                     |
| `status`      | Text   | One of: `For Sale`, `Sold`, `Coming Soon`           |
| `mainPhoto`   | Text   | Image URL                                          |
| `gallery`     | Text   | Comma-separated image URLs (optional)              |
| `description` | Text   | Long text field                                    |

### Team collection (ID: `Team`)

| Field name | Type | Notes           |
| ---------- | ---- | --------------- |
| `name`     | Text |                 |
| `title`    | Text | Job title       |
| `headshot` | Text | Image URL       |
| `bio`      | Text | Long text field |
| `email`    | Text |                 |
| `phone`    | Text |                 |

## Step 4 — Seed sample data

From your project root, with Node.js:

```bash
npm install @wix/sdk @wix/data
WIX_API_KEY=<fresh-api-key> WIX_ACCOUNT_ID=<from wix.config.json> WIX_SITE_ID=<from wix.config.json> \
  node scripts/seed-cms.mjs
```

- Generate a **fresh** API key at manage.wix.com/account/api-keys (don't reuse any key
  that's been shared in chat or logs — treat those as burned).
- `accountId` and `siteId` are both in the `wix.config.json` file the scaffold command
  created at your project root.

This inserts the 6 sample listings and 4 sample team members used throughout the
design. From here on, **anyone with Dashboard access can add, edit, or remove
listings and team members directly in the Content Manager** — no code changes or
redeploys needed. That's the whole point of wiring this up to real collections
instead of hardcoding the content.

## Step 5 — Preview locally

```bash
wix dev
```

Follow the printed link to open the site in your browser. Hot reload is on, so any
further tweaks show up immediately.

## Step 6 — Publish

```bash
wix build
wix release
```

`release` pushes your project to Wix's servers, publishes it, and prints your live
site URL and a dashboard link. Share that URL once you've reviewed it — that's your
"hosted link before sharing it anywhere" moment.

If you update content later purely through the Content Manager (no code changes),
you don't need to run `wix release` again — the site reads the CMS at request time.
Only re-run `wix release` after changing code in `src/`.

## Rebranding this template for a different client later

- Colors and fonts: `src/styles/global.css`, the `:root` block at the top.
- Agency name: appears as literal text in `src/components/Nav.astro` and
  `src/components/Footer.astro` — search each file for "Johnston & Daniel".
- Hero headline/subheadline, testimonial, and the "Since 1978" story blurb: in
  `src/pages/index.astro` and `src/components/Testimonial.astro`.
- Sample listings/team data: `src/lib/cms.ts` (fallback data) and
  `scripts/seed-cms.mjs` (what actually gets inserted into the CMS).
