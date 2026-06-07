import { useEffect, useRef, useState } from "react";
import { Play, Pause, Eye, EyeOff, Repeat, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ayah } from "./useYaseen";
import type { Settings, VerseStatus } from "./useProgress";

interface Props {
  ayah: Ayah;
  settings: Settings;
  mode: "learner" | "memorizer";
  status: VerseStatus;
  onStatusChange: (s: VerseStatus) => void;
  onPlayStart?: () => void;
}

const STATUS_CYCLE: VerseStatus[] = ["not-started", "practicing", "mastered"];
const STATUS_LABEL: Record<VerseStatus, string> = {
  "not-started": "Not Started",
  practicing: "Practicing",
  mastered: "Mastered",
};
const STATUS_CLASS: Record<VerseStatus, string> = {
  "not-started": "bg-muted text-muted-foreground",
  practicing: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  mastered: "bg-accent text-accent-foreground",
};

export function VerseCard({ ayah, settings, mode, status, onStatusChange, onPlayStart }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loops, setLoops] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [hidden, setHidden] = useState(mode === "memorizer");

  useEffect(() => {
    setHidden(mode === "memorizer");
  }, [mode, ayah.number]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const play = () => {
    onPlayStart?.();
    const a = audioRef.current;
    if (!a) return;
    setRemaining(loops - 1);
    a.currentTime = 0;
    void a.play();
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
    setRemaining(0);
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {ayah.numberInSurah}
        </div>
        <div className="flex items-center gap-1.5">
          {mode === "memorizer" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setHidden((h) => !h)}
              aria-label={hidden ? "Reveal verse" : "Hide verse"}
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLoops((l) => (l >= 10 ? 1 : l + 1))}
            title={`Repeat ${loops}x`}
            className="gap-1"
          >
            <Repeat className="h-4 w-4" />
            <span className="text-xs">{loops}x</span>
          </Button>
          <Button
            size="sm"
            variant={playing ? "secondary" : "default"}
            onClick={playing ? stop : play}
            aria-label={playing ? "Pause" : "Play verse"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "font-arabic text-right transition-all duration-300",
          hidden && "select-none blur-md",
        )}
        style={{ fontSize: settings.fontSize, lineHeight: 2 }}
      >
        {ayah.arabic}
      </div>

      {settings.showTransliteration && !hidden && (
        <p className="mt-4 text-sm italic text-muted-foreground">{ayah.transliteration}</p>
      )}
      {settings.showTranslation && !hidden && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{ayah.translation}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
        <button
          onClick={() => {
            const i = STATUS_CYCLE.indexOf(status);
            onStatusChange(STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length]);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
            STATUS_CLASS[status],
          )}
        >
          {status === "mastered" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          {STATUS_LABEL[status]}
        </button>
        {playing && remaining > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {remaining} repeat{remaining === 1 ? "" : "s"} left
          </span>
        )}
      </div>

      <audio
        ref={audioRef}
        src={ayah.audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (remaining > 0) {
            setRemaining((r) => r - 1);
            const a = audioRef.current;
            if (a) {
              a.currentTime = 0;
              void a.play();
            }
          } else {
            setPlaying(false);
          }
        }}
      />
    </article>
  );
}