# AIAudit App

Interactive dashboard for the MedAudit / AIAudit research work. It shows, per model, the four audit results (FAC, ACS, UDAG, Closure), the trust score, the faithfulness test and the proof suite, each with a plain-language explanation of what the scores mean.

Live site: https://bad-eastwind.github.io/AIAudit-App/

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # type check + production build into dist/
npm run preview
```

## Data

The site is fully static. It reads JSON from `public/data/`:

- `models.json` - model list
- `compare.json` - one row per model for the compare page
- `reports/<model>.json` - full audit report and proof results

To regenerate from a folder of audit outputs:

```bash
npm run build:data -- <path-to-audit-outputs>
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. In the repository settings, set Pages > Source to "GitHub Actions" once.
