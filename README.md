# Daegu Digital Twin Map

Web-based 3D GIS practice project for exploring an urban digital twin concept in Daegu.

## Current prototype

- React + Vite frontend
- CesiumJS 3D globe
- OpenStreetMap imagery
- Responsive layout for tablet and mobile
- Sample building objects (clearly marked demo data)
- Building list search and selection
- Layer toggles and object detail card
- GitHub Actions workflow for GitHub Pages deployment

> Sample building objects are illustrative placeholders, not official building data.

## Development

```bash
npm install
npm run dev
npm run build
```

## Deployment

GitHub Pages is configured through `.github/workflows/deploy.yml`. In repository Settings → Pages, set the source to **GitHub Actions**.

