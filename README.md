# DPG Drip and Gear — Store

A multi-page storefront (Home / Products / About / Contact) plus a password-protected
admin page for editing prices and stock, with a real backend so changes go live for
every visitor immediately.

## Pages
- `index.html` — home page: hero, shop-by-category, featured products, new arrivals,
  special offers, "why shop with us", brand promise, WhatsApp signup banner.
- `products.html` — full catalog, filterable by category (also reachable via
  `products.html?category=polos` links from the home page/header) and searchable by name.
- `about.html` — brand story and what customers can expect.
- `contact.html` — real WhatsApp, call, and email links (no fake contact form that
  would just go nowhere).
- `admin.html` — password-protected price + stock editor (see below).

## Shared code
- `common.js` — loads store settings + catalog once per page, renders the header and
  footer, and provides `formatPrice`, `waLink`, `telLink`, `mailLink` helpers.
- `catalog-ui.js` — shared product card + modal (used by both the homepage's mini
  sections and the full products grid, so there's one modal implementation, not two).
- `home.js` / `products.js` — page-specific logic.

## Before going live
1. `config.json` now has your uncle's real WhatsApp number, call number, and email —
   double check they're correct.
2. `adminPassword` in `config.json` is only read the **first time** the server starts
   (it gets hashed into `data/admin.json`). To change it later: delete `data/admin.json`,
   edit `config.json`, restart.
3. Deploy somewhere that stays running and keeps the `data/` folder persistent between
   restarts (Render, Railway, etc.) — same as before.

## How "Featured", "New Arrivals", and "Special Offers" work
- **Featured** and **New Arrivals** are manual flags (`featured: true` / `isNew: true`)
  on specific items in `catalog.js`. I picked a starting set across categories — edit
  that file directly to change which items show in those sections.
- **Special Offers** isn't manually flagged — it's automatic. Any item whose *live*
  price (set from `/admin.html`) is lower than its `defaultPrice` in `catalog.js`
  automatically shows a green "Offer" badge and a strikethrough original price,
  everywhere it appears. Reset that item's price back to default in the admin panel
  and the offer badge disappears on its own.

## A note on what I didn't copy from the reference site
The reference site (LuxeMart) has a customer-testimonials section with named "verified
buyers" and quotes, and an email newsletter signup. I didn't replicate those as-is:
- Fabricated customer names and reviews would be fake social proof on a real storefront
  — I built a "Why shop with DPG" section with brand-promise quotes instead, which
  isn't attributed to invented people. Real customer testimonials can replace these
  once you actually have them.
- There's no email marketing backend here, so a newsletter signup box would collect
  emails that go nowhere. I replaced it with a "Join on WhatsApp" banner, which is
  something that actually works today.

## On the product branding
Unchanged from before: every product uses a generic, style-based name — no brand names
appear anywhere in the catalog or on the site, because several of the original supplied
photos showed signs consistent with counterfeit goods.

## Reviews (moderated)
Customers can leave a star rating + comment on any product from its product page/modal.
New reviews are **hidden by default** — they only appear on the site, and count toward
that product's average rating, after you approve them from `/admin.html` under
"Review moderation." Reject removes a pending review entirely; the same button becomes
"Delete" for already-approved reviews, in case one needs to come down later.

## Running it locally
```
node server.js
```
No `npm install` needed — everything uses Node's built-in modules only.

## Adding new products yourself (including Electronics)
`/admin.html` now has an **"+ Add a new product"** section above the price table:
name, category (includes the new **Electronics** category, ready for phone chargers,
earpods, car chargers, etc.), price, optional sizes, a short description, and a photo.

- New products go live immediately and are automatically marked as a **New Arrival**
  on the homepage — no extra step needed for "just came in" stock.
- Products added this way show a small "(added)" tag in the admin price table, and have
  a **Remove** button next to them — removing one deletes its photo file and any prices/
  stock/reviews tied to it too. The original 56 photographed items from `catalog.js`
  don't have a Remove button here on purpose — editing those still means editing
  `catalog.js` directly, to avoid accidentally deleting the base catalog from the browser.
- Photos are capped at 6MB and must be JPG, PNG, or WEBP.

## Deployment notes (Render or similar)
The server respects two optional environment variables, meant for hosting:

- `DATA_DIR` — where the `data/` folder (prices, stock, reviews, custom products,
  hashed admin password) lives. Point this at your host's **persistent disk** mount
  path (e.g. `/var/data` on Render) so this data survives redeploys. Without it,
  data is stored next to the code, which most hosts wipe on every deploy.
- `ADMIN_PASSWORD` — sets the admin password on first boot instead of reading it from
  `config.json`. Use this so a real password doesn't have to sit in your GitHub repo.
  Only matters the very first time the server starts (before `data/admin.json` exists).

`PORT` is already handled automatically — most hosts set it for you.

## Cart / multi-item checkout
Customers can now add several items to a cart (a 🛒 icon in the header shows the
count) and check out with **one combined WhatsApp message** listing every item,
size, quantity, and the total — instead of messaging item by item.

- Items without size options (watches, most electronics) get a quick "Add" button
  right on the product card.
- Items with sizes (polos, shirts, sneakers, pants) need the size picked in the
  product modal first, then "Add to Cart" — this avoids silently adding the wrong size.
- The cart lives in the visitor's own browser (not on the server), since there's no
  account system — it's just there to help them build up an order before messaging.
- The single-item "Chat on WhatsApp" / "Call to order" buttons are still there in the
  modal too, for someone who just wants one thing immediately without using the cart.

## Graphics upgrade: animations + 3D hero
- **Scroll animations everywhere** (`animations.js`): product cards, category tiles,
  feature blocks, promise quotes, and contact cards fade/slide in as you scroll to
  them, and the homepage's "items in stock" / "categories" numbers count up. This is
  plain JavaScript (IntersectionObserver) — no library, negligible page weight, and
  it respects the visitor's "reduce motion" accessibility setting automatically.
- **3D hero centerpiece** (`hero-3d.js` + Three.js from a CDN, homepage only): a
  slow-rotating ring of six real product photos, with a subtle mouse-tilt effect.
  It only loads/runs if the browser supports WebGL, the screen is wider than 560px,
  and the visitor hasn't asked for reduced motion — otherwise the page quietly falls
  back to the plain tilted-photo-stack hero that was already there, so nobody on an
  older phone or slow connection is stuck waiting on it or burning extra data.
  The six textures used are small, optimized copies (~25KB each) in
  `assets/images/3d/`, not the full-size product photos.

## Graphics upgrade
- **Scroll animations**: feature cards, product cards, category tiles, testimonials,
  and contact cards fade/slide in as you scroll to them (`animations.js`). Respects
  `prefers-reduced-motion` and costs almost nothing — no external library.
- **Custom icons**: delivery/chat/returns/payment icons, the cart icon, and contact
  page icons are now hand-drawn SVGs (`icons.js`) instead of emoji, so they render
  identically on every device instead of varying by OS emoji font.
- **3D hero showcase**: on the homepage, a slow-rotating ring of real product photos
  (Three.js, loaded from a CDN) replaces the static photo stack — drag/mouse-move
  tilts the camera slightly. It's genuinely optional: if the visitor's browser can't
  run WebGL, has "reduce motion" turned on, is on a narrow/likely low-power phone
  screen, or is offline (so the Three.js CDN script never loads), it silently keeps
  the original static photo stack instead — nobody sees a broken page.

## Favicon
No logo file had been supplied yet, so a placeholder favicon was generated — a
"DPG" monogram in the site's ink/brass colors (`public/assets/favicons/`). It covers
browser tabs, iOS "Add to Home Screen," and Android's home-screen/app icon via
`site.webmanifest`. Swap in the real logo whenever it's ready: replace the files in
`assets/favicons/` (same filenames/sizes: favicon.ico, favicon-16.png, favicon-32.png,
apple-touch-icon.png at 180×180, icon-192.png, icon-512.png) and nothing else needs
to change.

## UI/UX pass
- **Back to top button**: appears once you scroll down a bit, on every page.
- **Loading skeletons**: product grids show shimmering placeholder cards while
  data is loading, instead of a blank page.
- **Recently viewed**: the homepage shows a "Recently Viewed" section for
  returning visitors, based on what they've opened before (stored in their
  own browser).
- **Breadcrumbs**: Home / Products / [Category] on the products page (updates
  as you filter), Home / [Category] / [Product name] inside the product
  view, and simple Home / About and Home / Contact trails on those pages.
- **Sticky "Add to Cart" on mobile**: while scrolling a product's details on
  a phone, the Add to Cart button stays pinned at the bottom of the screen
  instead of scrolling out of view.
- Fixed a real bug found while wiring the above: the product modal had a
  conflicting CSS rule that would have silently clipped long content (a long
  description plus many reviews) instead of letting it scroll.

## Real brand colors and logo applied
The site now uses the actual DPG Drip and Gear logo and its exact colors,
sampled directly from the logo file:
- Navy `#111727` — replaces the old approximate charcoal
- Blue `#018fd9` — replaces the old brass/gold as the primary accent
- Lime `#8ee62f` — new secondary accent, used in the hero glow

The real logo now appears in the site header (`assets/brand/logo-header.png`)
and as the actual favicon/home-screen icon (`assets/favicons/`), replacing
the earlier placeholder "DPG" monogram. `assets/brand/logo-full.jpg` keeps
the complete original logo (with tagline) on hand for anywhere it's needed
at full size later (e.g. a printed flyer or social media).

Text contrast was re-checked against WCAG guidelines for every place the new
blue is used — two spots (star ratings) needed the deeper blue shade instead
of the raw brand blue to stay legible on light backgrounds; everything else
already had enough contrast.

Also added: a subtle light-sweep animation across primary buttons on hover.

## Full logo + more color + sliding gallery
- The **full logo** (DPG / DRIP & GEAR + tagline, not just the cropped mark) now
  appears in the homepage hero, gently floating, above the headline.
- **More color throughout**: the features band now has a soft blue-to-lime
  tint instead of plain white, the three "Why shop with DPG" cards each get a
  different brand-color accent (blue / lime / deep blue) instead of all
  matching, and category tiles glow blue or lime alternately on hover.
- A **colorful animated gradient divider** (blue → lime → blue, slowly
  shifting) breaks up the hero from the rest of the page.
- A **sliding photo marquee** — an auto-scrolling strip of product photos —
  sits right below the hero, pauses on hover, and respects "reduce motion"
  settings for anyone who has that turned on.
- Hero photo tiles were sized down a bit to make room for the logo and keep
  the hero from feeling crowded.
