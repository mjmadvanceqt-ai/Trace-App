$ErrorActionPreference = 'Stop'
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = (Join-Path $sdk 'platform-tools') + ';' + $env:Path
Push-Location android
try {
  & .\gradlew.bat assembleRelease --no-daemon --stacktrace
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }
$apk = Join-Path $PWD 'android\app\build\outputs\apk\release\app-release.apk'
$unsignedApk = Join-Path $PWD 'android\app\build\outputs\apk\release\app-release-unsigned.apk'
if (Test-Path $apk) {
  Write-Output ('APK=' + $apk)
} elseif (Test-Path $unsignedApk) {
  throw 'Unsigned APK was generated. Configure TRACE_RELEASE_KEYSTORE, TRACE_RELEASE_STORE_PASSWORD, and TRACE_RELEASE_KEY_PASSWORD before building a distributable APK.'
} else {
  throw 'Release APK was not generated'
}
