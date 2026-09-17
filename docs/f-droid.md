# F-Droid release checklist

F-Droid submissions use YAML metadata, not XML. The ready-to-review metadata
file is [metadata/com.trace.app.yml](../metadata/com.trace.app.yml).

1. Create a signed GitHub release using [docs/github-release-v1.0.0.md](github-release-v1.0.0.md) as the release body.
2. Tag the release `v1.0.0` after the release commit is on GitHub.
3. Build and attach the signed `app-release.apk`. Do not publish the debug or unsigned APK as the production download.
4. Submit the Git repository and `metadata/com.trace.app.yml` to the F-Droid inclusion request process.
5. Confirm that the F-Droid build server can reproduce the APK from the tagged source commit.
6. Confirm the app complies with F-Droid policy, especially network access, service attribution, telemetry, and anti-feature declarations.
7. Keep the app source, Gradle configuration, and release notes public and reproducible.

## Metadata facts

- Application ID: `com.trace.app`
- Version name: `1.0`
- Version code: `1`
- License: GPL-3.0-or-later
- Category: Sports
- Source repository: https://github.com/mjmadvanceqt-ai/Trace-App

The app uses OpenStreetMap map tiles and public route services by default. Keep
the required attribution visible and review the service terms before operating
a public high-volume deployment.
