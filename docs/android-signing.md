# Android signing

The distributable APK is signed with the private `trace-release` key. The
keystore is intentionally excluded from Git and must be backed up securely;
losing it prevents updates to the same Android application ID.

The local build reads these properties from the user Gradle configuration:

```properties
TRACE_RELEASE_KEYSTORE=C:/path/to/release-keystore.jks
TRACE_RELEASE_STORE_PASSWORD=<private value>
TRACE_RELEASE_KEY_PASSWORD=<private value>
```

Build the signed release with:

```powershell
npm run build
npm run android:sync
npm run android:build
```

The resulting file is `android/app/build/outputs/apk/release/app-release.apk`.
Verify it before publishing:

```powershell
Get-FileHash .\android\app\build\outputs\apk\release\app-release.apk -Algorithm SHA256
```

Never commit the keystore, passwords, or signing key backups to the public
repository.