# Android release obfuscation for Capacitor + WebView assets.
-keepattributes *Annotation*,Signature,InnerClasses
-keep class com.getcapacitor.** { *; }
-keep class com.trace.app.** { *; }
-keepnames class org.apache.cordova.** { *; }
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

# Preserve JavaScript bridge interfaces used by the WebView.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface public *;
}

# Keep stack traces readable enough for production debugging without full symbol names.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
