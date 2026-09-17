# F-Droid release checklist

1. Publish the repository to GitHub and keep the release APK attached to a GitHub Release.
2. Use the GitHub repository URL as the source for the F-Droid metadata entry.
3. Upload the signed APK or AAB artifact from the Android release pipeline as the public release asset.
4. Add the repository to the F-Droid app metadata with the application name, summary, and category.
5. Confirm the app complies with the F-Droid policy, especially around network access, telemetry, and anti-feature declarations.
6. Keep the app source open and reproducible from the public repo.

This project is intentionally open-source and uses open map tiles and public route services by default, which is compatible with an open distribution flow.
