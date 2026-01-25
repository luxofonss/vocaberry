// app.config.js - Đọc .env và inject vào app
require('dotenv').config();

module.exports = {
  expo: {
    name: "vocaberry",
    slug: "vocaberry",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    jsEngine: "hermes",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.luxofons.vocaberry",
      jsEngine: "hermes",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.luxofons.vocaberry",
      jsEngine: "hermes"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-audio",
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "ee27471a-28e9-4432-ab42-3406c4fb97af"
      },
      EXPO_PUBLIC_UNSPLASH_ACCESS_KEY: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '',
      EXPO_PUBLIC_POLLINATIONS_AUTH_TOKEN: process.env.EXPO_PUBLIC_POLLINATIONS_AUTH_TOKEN || '',
      EXPO_PUBLIC_CLAUDE_API_KEY: process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
    }
  }
};