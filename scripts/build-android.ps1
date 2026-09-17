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
$apk = Join-Path $PWD 'android\app\build\outputs\apk\release\app-release-unsigned.apk'
if (Test-Path $apk) { Write-Output ('APK=' + $apk) } else { throw 'APK was not generated' }
