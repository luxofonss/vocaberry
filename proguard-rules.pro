# ProGuard Rules for React Native Expo App
# Giúp giảm kích thước build bằng cách loại bỏ code không sử dụng

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**
-keepclassmembers class * {
  @expo.modules.core.interfaces.DoNotStrip *;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native classes
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# Keep React Native Bridge
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }

# Keep AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# Keep Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Keep Navigation
-keep class com.swmansion.rnscreens.** { *; }

# Keep Image Picker
-keep class expo.modules.imagepicker.** { *; }

# Keep Speech
-keep class expo.modules.speech.** { *; }

# Keep Linear Gradient
-keep class expo.modules.lineargradient.** { *; }

# Keep Blur
-keep class expo.modules.blur.** { *; }

# Keep Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Remove logging in release (optional - giúp giảm size thêm)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep line numbers for crash reporting (optional - có thể xóa để giảm size thêm)
-keepattributes SourceFile,LineNumberTable

