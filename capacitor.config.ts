import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for wrapping Noor as a native Android app.
 *
 * One-time setup (run locally, not in Lovable):
 *   bun add -d @capacitor/cli
 *   bun add @capacitor/core @capacitor/android
 *   bunx cap init "Noor" "app.lovable.noor" --web-dir=dist
 *   # build a static export of the web app into ./dist, then:
 *   bunx cap add android
 *   bunx cap sync android
 *   bunx cap open android   # launches Android Studio
 *
 * Because every verse (text + audio) is bundled in /public, the resulting
 * APK works fully offline — no network permission required at runtime.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.noor",
  appName: "Noor",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;