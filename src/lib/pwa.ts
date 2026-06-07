// Guarded service-worker registration. Only registers in the published app.
const APP_SW_PATH = "/sw.js";

function isPreviewHost(hostname: string): boolean {
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")) return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterAppSw(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => {
        const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "";
        return url.endsWith(APP_SW_PATH);
      })
      .map((r) => r.unregister()),
  );
}

export async function registerPwa(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const inIframe = window.self !== window.top;
  const isDev = !import.meta.env.PROD;
  const isPreview = isPreviewHost(window.location.hostname);
  const killSwitch = url.searchParams.get("sw") === "off";

  if (isDev || isPreview || inIframe || killSwitch) {
    await unregisterAppSw();
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    /* ignore */
  }
}