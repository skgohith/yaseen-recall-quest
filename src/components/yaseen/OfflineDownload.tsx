import { useEffect, useState } from "react";
import { Download, CheckCircle2, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Ayah } from "./useYaseen";

const STORAGE_KEY = "noor.offline.cached";
const CONCURRENCY = 4;

type Status = "idle" | "downloading" | "done" | "error";

interface CachedMap {
  [reciter: string]: { count: number; total: number; at: number };
}

function loadCached(): CachedMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as CachedMap;
  } catch {
    return {};
  }
}

function saveCached(map: CachedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function OfflineDownload({ ayahs, reciter }: { ayahs: Ayah[] | undefined; reciter: string }) {
  const total = ayahs?.length ?? 0;
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<CachedMap>({});
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    setCached(loadCached());
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((r) => setSwReady(!!r?.active));
    }
  }, []);

  const entry = cached[reciter];
  const isFullyCached = entry && entry.count >= total && total > 0;

  async function downloadAll() {
    if (!ayahs || ayahs.length === 0) return;
    setStatus("downloading");
    setError(null);
    setDone(0);

    let completed = 0;
    let failed = 0;
    const queue = [...ayahs];

    async function worker() {
      while (queue.length > 0) {
        const a = queue.shift();
        if (!a) break;
        try {
          const res = await fetch(a.audio, { cache: "reload" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          // Consume the body so the SW caches the full response.
          await res.blob();
        } catch {
          failed += 1;
        }
        completed += 1;
        setDone(completed);
      }
    }

    try {
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      const next: CachedMap = {
        ...loadCached(),
        [reciter]: { count: total - failed, total, at: Date.now() },
      };
      saveCached(next);
      setCached(next);
      if (failed > 0) {
        setError(`${failed} file${failed === 1 ? "" : "s"} failed. You can retry.`);
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  async function clearCache() {
    if (typeof caches === "undefined") return;
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith("noor-quran-") || n === "noor-pages")
        .map((n) => caches.delete(n)),
    );
    const next = { ...loadCached() };
    delete next[reciter];
    saveCached(next);
    setCached(next);
    setStatus("idle");
    setDone(0);
  }

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="space-y-4">
      {!swReady && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Offline mode activates after you publish and open the app outside the Lovable preview.
            You can still pre-fetch files now — they'll be reused once the service worker is active.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">All 83 verses · audio + text</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {isFullyCached
                ? "Saved on this device. Available offline."
                : entry
                  ? `${entry.count} / ${entry.total} previously cached`
                  : "Not yet downloaded"}
            </div>
          </div>
          {isFullyCached && status !== "downloading" && (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </div>

        {status === "downloading" && (
          <div className="mt-4 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Downloading verse {done} of {total}
              </span>
              <span>{pct}%</span>
            </div>
          </div>
        )}

        {error && status === "error" && (
          <p className="mt-3 text-xs text-destructive">{error}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={downloadAll}
            disabled={status === "downloading" || total === 0}
            className="gap-2"
          >
            {status === "downloading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isFullyCached ? "Re-download" : status === "downloading" ? "Downloading…" : "Download for offline"}
          </Button>
          {entry && status !== "downloading" && (
            <Button variant="ghost" onClick={clearCache} className="gap-2 text-muted-foreground">
              <Trash2 className="h-4 w-4" />
              Clear cached audio
            </Button>
          )}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Approx. 25–40 MB depending on reciter. Files are stored in your browser cache and reused
        whenever you open Noor — no internet needed once the download finishes.
      </p>
    </div>
  );
}