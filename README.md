# ClientFlow CRM

A responsive frontend CRM for a fictional web agency: manage customers, sales opportunities and follow-ups in a calm green workspace.

## Run locally
Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. `npm run build` generates `dist/`; `npm run preview` previews that production build. `npm test` checks core data rules.

## Features
- Dashboard totals derived from the current data, pipeline value/stage breakdown, recent opportunities and pending follow-ups.
- Customers: create, edit, delete with confirmation, search name/email/company, status filter and alphabetical sorting.
- Leads: create/edit/delete, five-stage pipeline, stage selection, INR values and stage filters.
- Tasks: create/edit/delete, complete/reopen, optional customer, priority, due date and overdue marker.
- Versioned localStorage key, fictional first-run demo records, invalid-data fallback, visible storage failure warning and confirmed demo reset.
- Responsive navigation, scrollable tables/pipeline, native accessible dialogs and labeled controls.

## Stack and structure
React, Vite, JavaScript, React Router, Lucide icons and plain CSS.

| File | Responsibility |
| --- | --- |
| `src/App.jsx` | Shared layout, routes, page components, forms and CRUD actions |
| `src/data.js` | Fictional records, IDs, formatting, validation and data rules |
| `src/useCRM.js` | Load browser state once and persist state changes |
| `src/main.jsx` | React entry and HashRouter |
| `src/styles.css` | Layout, visual system and responsive breakpoints |
| `tests/data.test.js` | Data integrity and calculated metrics tests |
| `INTERVIEW_GUIDE_HINGLISH.md` | Implementation diary, explanation and interview demo |

## Data rules
Deleting a customer also deletes their linked leads and tasks; confirmation names the linked record count. Dashboard totals are calculated rather than stored separately. Blank names/titles, invalid emails/phone formats and negative deal values are rejected. Data is seeded only when storage is missing or invalid; a valid empty workspace stays empty.

## Deployment
Static build output: `dist`. HashRouter uses URLs such as `/#/customers`, so refreshing a page works on static hosts without rewrite rules. `vite.config.js` sets `base: './'`, so the same build works on a GitHub Pages project subpath and on Netlify/Vercel (publish `dist`).

**Live demo:** https://sanjeet-saini.github.io/clientflow-crm/

GitHub Pages is deployed automatically by `.github/workflows/deploy.yml` on every push to `main` (install → test → build → publish `dist`).

## Limitations
This is a frontend interview demo, not a production CRM. There is no backend, authentication, cloud database, cross-device synchronization or real integration. localStorage belongs to this browser and origin; clearing browser storage removes the data. Another tab can overwrite changes (no conflict resolution). Use fictional data only. Google Fonts needs internet; system sans-serif is the fallback.

Future: backend API, authentication, authorization, cloud storage, pagination, CSV export and automated browser regression tests.
