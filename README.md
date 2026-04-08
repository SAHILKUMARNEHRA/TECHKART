# TechKart

TechKart is a modern buyer-only ecommerce web app inspired by Flipkart-style usability (without copying UI), built with Next.js + Tailwind CSS.

## Highlights

- Homepage with category shortcuts, hero banner, trending products, top brands, and budget-first sections
- Product listing page with filters (price, brand, rating, RAM, storage, category) and sorting
- Product detail page with image gallery, offers, specs table, reviews, and compare CTA
- Product compare flow (2 to 4 products side by side)
- Best Choice badges and price-first product sections
- Price history chart (30D / 90D) via backend snapshot API
- Google authentication using Firebase Auth
- Responsive design for mobile + desktop
- Custom TechKart logo included at `public/logo-techkart.svg`

## Tech Stack

- Frontend: Next.js (App Router), React, Tailwind CSS
- Auth: Firebase Authentication (Google provider)
- Data: Real marketplace feed via eBay API (optional), otherwise DummyJSON + fallback dataset
- Charts: Chart.js + react-chartjs-2
- Optional backend/database for extension: Node.js + MongoDB/Firebase

## Data Strategy

- Primary real-time source (optional): [eBay Buy Browse API](https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search) via backend
- Free fallback source: [DummyJSON](https://dummyjson.com/) free API
- Smartwatch + reliability fallback: local curated dataset in `src/lib/fallback-data.ts`
- Price history: persisted daily snapshots in `data/price-history.json` served by `/api/price-history/[id]`

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

3. Configure Firebase:
- Create a Firebase project
- Enable Google sign-in in Authentication > Sign-in method
- Fill `NEXT_PUBLIC_FIREBASE_*` values in `.env.local`

4. Optional: enable real live product feed (recommended):
- Create eBay developer app at [developer.ebay.com](https://developer.ebay.com/)
- Add these in `.env.local`:
  - `EBAY_CLIENT_ID=...`
  - `EBAY_CLIENT_SECRET=...`

5. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Development Stability

- `npm run dev` now uses Webpack for local development to avoid Turbopack watcher issues on some macOS setups.
- Live eBay product fetching is disabled by default in local development so localhost stays responsive.
- To opt back into live marketplace data locally, add `TECHKART_ENABLE_LIVE_MARKET=true` to `.env.local` and restart the dev server.

## Routes

- `/` Home page
- `/products` Product listing page
- `/products/[id]` Product detail page
- `/compare` Compare products
- `/login` Login page
- `/api/products` Backend product API
- `/api/products/[id]` Backend product detail API
- `/api/price-history/[id]?range=30` Backend price history API

## Notes

- This is intentionally buyer-only (no seller dashboard and no inventory management UI).
- If Firebase env vars are missing, Google auth shows a setup message instead of crashing.

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import project in Vercel
3. Add environment variables from `.env.example` plus optional eBay keys
4. Deploy
