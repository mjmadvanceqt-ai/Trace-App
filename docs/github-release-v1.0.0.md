# Trace v1.0.0

Trace is a mobile-first walking and route-planning app for creating, saving, running, and sharing routes.

## Highlights

- Draw routes on an OpenStreetMap map with Leaflet.
- Snap drawn routes to roads through public OSRM-compatible routing services.
- Save, plan, run, and share traces.
- Track pace and simulate an active run.
- Package the web app as a native Android application with Capacitor.
- Build Android release variants with R8/ProGuard enabled.

## Android download

Download the signed `app-release.apk` asset below and install it on an Android device running Android 8.0 or newer.

The APK must be signed with the project's release key before publishing. Do not publish the debug or unsigned APK as the production download.

## Privacy and network services

Trace does not require a proprietary map SDK. The app uses OpenStreetMap map tiles and public routing services. Network access is required for map tiles and route snapping. Review the service terms and attribution requirements before operating a public high-volume deployment.

## Verification

- Application ID: `com.trace.app`
- Version name: `1.0`
- Version code: `1`
- License: GPL-3.0-or-later
- Release build: `assembleRelease` with R8/ProGuard and resource shrinking

## Source

- Repository: https://github.com/mjmadvanceqt-ai/Trace-App
- License: https://github.com/mjmadvanceqt-ai/Trace-App/blob/main/LICENSE
- F-Droid metadata: https://github.com/mjmadvanceqt-ai/Trace-App/blob/main/metadata/com.trace.app.yml

## Checksums

After attaching the final signed APK, publish its SHA-256 checksum here:

```text
SHA-256: 0B4E0F08DB50401475B61DDB86AF3CF14ED11C7D011CE8F29B0505D10CADFB15
```
