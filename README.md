# Trace App

Trace App is a mobile-first walking and route-planning experience that lets users draw a route, snap it to roads, save traces, track pace, and run or share routes from a compact Android-friendly interface.

## Features

- OpenStreetMap-based map rendering with Leaflet
- OSRM/OpenStreetMap routing fallback for route snapping
- Route creation, save, and share flow
- Pace planning and run simulation
- Android packaging via Capacitor
- PostgreSQL-ready backend configuration through `DATABASE_URL`

## Local development

```bash
npm install
npm run dev
```

The app listens on port 8080 for local development.

## Production build

```bash
npm run build
npm run typecheck
```

## Android release build

```bash
npm run android:sync
npm run android:build
```

This project enables Android release minification with R8/ProGuard and ships the release artifact from the Android Gradle output.

## Data layer

The app is configured to work with a Postgres-compatible database via `DATABASE_URL` when deployed. Without it, the app falls back to the embedded PGLite preview database so it still runs locally.

## F-Droid note

The repository is prepared for public distribution. For F-Droid listing, add the repo URL and release APK/AAB metadata in the F-Droid app metadata or a mirrored repository. See [docs/f-droid.md](docs/f-droid.md) for the exact release checklist.

## License

This project is licensed under the GNU General Public License v3.0 or later. See [LICENSE](LICENSE).
