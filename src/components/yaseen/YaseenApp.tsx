import { useMemo, useState } from "react";
import {
  Home,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Brain,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useYaseen, RECITERS, type Ayah } from "./useYaseen";
import { useProgress, type VerseStatus } from "./useProgress";
import { VerseCard } from "./VerseCard";

type Tab = "dashboard" | "read" | "progress" | "settings";
type Mode = "learner" | "memorizer";

const TOTAL_VERSES = 83;

export function YaseenApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [mode, setMode] = useState<Mode>("learner");
  const [chunkIndex, setChunkIndex] = useState(0);

  const { state, setStatus, setLastVerse, updateSettings, reset, loaded } = useProgress();
  const { settings } = state;
  const { data: ayahs, isLoading, error } = useYaseen(settings.reciter);

  const chunks = useMemo<Ayah[][]>(() => {
    if (!ayahs) return [];
    const size = settings.chunkSize;
    const out: Ayah[][] = [];
    for (let i = 0; i < ayahs.length; i += size) out.push(ayahs.slice(i, i + size));
    return out;
  }, [ayahs, settings.chunkSize]);

  const mastered = Object.values(state.statuses).filter((s) => s === "mastered").length;
  const practicing = Object.values(state.statuses).filter((s) => s === "practicing").length;
  const percent = Math.round((mastered / TOTAL_VERSES) * 100);

  const goToVerse = (verse: number) => {
    const idx = Math.floor((verse - 1) / settings.chunkSize);
    setChunkIndex(idx);
    setLastVerse(verse);
    setTab("read");
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Noor</h1>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Surah Yāsīn · 36
              </p>
            </div>
          </div>
          {tab === "read" && (
            <div className="flex items-center rounded-full bg-muted p-1">
              <ModeChip active={mode === "learner"} onClick={() => setMode("learner")} icon={<GraduationCap className="h-3.5 w-3.5" />}>
                Learn
              </ModeChip>
              <ModeChip active={mode === "memorizer"} onClick={() => setMode("memorizer")} icon={<Brain className="h-3.5 w-3.5" />}>
                Memorize
              </ModeChip>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {!loaded || isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : tab === "dashboard" ? (
          <Dashboard
            mastered={mastered}
            practicing={practicing}
            percent={percent}
            lastVerse={state.lastVerse}
            onResume={() => goToVerse(state.lastVerse)}
            onStart={(m) => {
              setMode(m);
              goToVerse(state.lastVerse);
            }}
          />
        ) : tab === "read" ? (
          <ReadView
            chunks={chunks}
            chunkIndex={chunkIndex}
            setChunkIndex={setChunkIndex}
            mode={mode}
            settings={settings}
            statuses={state.statuses}
            onStatus={(v, s) => setStatus(v, s)}
            onActiveVerse={(v) => setLastVerse(v)}
          />
        ) : tab === "progress" ? (
          <ProgressView
            mastered={mastered}
            practicing={practicing}
            percent={percent}
            statuses={state.statuses}
            onJump={goToVerse}
          />
        ) : (
          <SettingsView
            settings={settings}
            onChange={updateSettings}
            onReset={reset}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
          <NavBtn icon={<Home className="h-5 w-5" />} label="Home" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <NavBtn icon={<BookOpen className="h-5 w-5" />} label="Read" active={tab === "read"} onClick={() => setTab("read")} />
          <NavBtn icon={<BarChart3 className="h-5 w-5" />} label="Progress" active={tab === "progress"} onClick={() => setTab("progress")} />
          <NavBtn icon={<SettingsIcon className="h-5 w-5" />} label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
        </div>
      </nav>
    </div>
  );
}

function ModeChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">Loading Surah Yāsīn…</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
      Couldn't load the surah: {message}
    </div>
  );
}

function Dashboard({
  mastered, practicing, percent, lastVerse, onResume, onStart,
}: {
  mastered: number; practicing: number; percent: number; lastVerse: number;
  onResume: () => void; onStart: (m: Mode) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs uppercase tracking-widest opacity-80">As-salāmu ʿalaykum</p>
        <h2 className="mt-1 font-arabic text-3xl" dir="rtl" style={{ lineHeight: 1.6 }}>
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </h2>
        <p className="mt-3 text-sm opacity-90">
          You're {percent}% of the way through memorizing the Heart of the Qur'an.
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white/90 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onResume} className="gap-2 bg-white text-primary hover:bg-white/90">
            <PlayCircle className="h-4 w-4" />
            Resume at verse {lastVerse}
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Mastered" value={mastered} tone="accent" />
        <Stat label="Practicing" value={practicing} tone="muted" />
        <Stat label="Of 83" value={TOTAL_VERSES} tone="muted" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          icon={<GraduationCap className="h-5 w-5" />}
          title="Learner Mode"
          desc="Read along, repeat audio in loops, build familiarity with each verse."
          cta="Start learning"
          onClick={() => onStart("learner")}
        />
        <ModeCard
          icon={<Brain className="h-5 w-5" />}
          title="Memorizer Mode"
          desc="Hide the text, recite from memory, then reveal to check yourself."
          cta="Start memorizing"
          onClick={() => onStart("memorizer")}
          highlight
        />
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "accent" | "muted" }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border p-4 text-center",
      tone === "accent" ? "bg-accent/30" : "bg-card",
    )}>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ModeCard({ icon, title, desc, cta, onClick, highlight }: {
  icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition hover:shadow-md",
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        highlight ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
      )}>
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <span className="mt-2 text-sm font-medium text-primary group-hover:underline">{cta} →</span>
    </button>
  );
}

function ReadView({
  chunks, chunkIndex, setChunkIndex, mode, settings, statuses, onStatus, onActiveVerse,
}: {
  chunks: Ayah[][];
  chunkIndex: number;
  setChunkIndex: (i: number) => void;
  mode: Mode;
  settings: ReturnType<typeof useProgress>["state"]["settings"];
  statuses: Record<number, VerseStatus>;
  onStatus: (v: number, s: VerseStatus) => void;
  onActiveVerse: (v: number) => void;
}) {
  const current = chunks[chunkIndex] ?? [];
  const total = chunks.length;
  const first = current[0]?.numberInSurah ?? 1;
  const last = current[current.length - 1]?.numberInSurah ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <Button size="sm" variant="ghost" onClick={() => setChunkIndex(Math.max(0, chunkIndex - 1))} disabled={chunkIndex === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Verses</div>
          <div className="text-sm font-semibold">{first}–{last} <span className="text-muted-foreground">/ {TOTAL_VERSES}</span></div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setChunkIndex(Math.min(total - 1, chunkIndex + 1))} disabled={chunkIndex >= total - 1} className="gap-1">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {current.map((a) => (
          <VerseCard
            key={a.number}
            ayah={a}
            settings={settings}
            mode={mode}
            status={statuses[a.numberInSurah] ?? "not-started"}
            onStatusChange={(s) => onStatus(a.numberInSurah, s)}
            onPlayStart={() => onActiveVerse(a.numberInSurah)}
          />
        ))}
      </div>
    </div>
  );
}

function ProgressView({
  mastered, practicing, percent, statuses, onJump,
}: {
  mastered: number; practicing: number; percent: number;
  statuses: Record<number, VerseStatus>; onJump: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Your journey</h2>
          <span className="text-3xl font-bold text-primary">{percent}%</span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <div><div className="text-xl font-semibold text-foreground">{mastered}</div><div className="text-muted-foreground">Mastered</div></div>
          <div><div className="text-xl font-semibold text-foreground">{practicing}</div><div className="text-muted-foreground">Practicing</div></div>
          <div><div className="text-xl font-semibold text-foreground">{TOTAL_VERSES - mastered - practicing}</div><div className="text-muted-foreground">To go</div></div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">All verses · tap to jump</h3>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
          {Array.from({ length: TOTAL_VERSES }, (_, i) => i + 1).map((n) => {
            const s = statuses[n] ?? "not-started";
            return (
              <button
                key={n}
                onClick={() => onJump(n)}
                className={cn(
                  "aspect-square rounded-lg text-xs font-medium transition hover:scale-105",
                  s === "mastered" && "bg-primary text-primary-foreground",
                  s === "practicing" && "bg-accent/60 text-accent-foreground",
                  s === "not-started" && "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
                title={`Verse ${n} · ${s}`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsView({
  settings, onChange, onReset, ayahs,
}: {
  settings: ReturnType<typeof useProgress>["state"]["settings"];
  onChange: (p: Partial<ReturnType<typeof useProgress>["state"]["settings"]>) => void;
  onReset: () => void;
  ayahs: Ayah[] | undefined;
}) {
  return (
    <div className="space-y-5">
      <SettingCard
        title="Offline download"
        desc="Save Surah Yāsīn audio and text to your device so it works without internet."
      >
        <OfflineDownload ayahs={ayahs} reciter={settings.reciter} />
      </SettingCard>

      <SettingCard title="Reciter" desc="Choose the voice you'd like to learn with.">
        <div className="grid gap-2">
          {RECITERS.map((r) => (
            <button
              key={r.id}
              onClick={() => onChange({ reciter: r.id })}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                settings.reciter === r.id
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {r.name}
              {settings.reciter === r.id && <span className="text-xs">Selected</span>}
            </button>
          ))}
        </div>
      </SettingCard>

      <SettingCard title="Arabic font size" desc={`${settings.fontSize}px`}>
        <Slider
          value={[settings.fontSize]}
          min={20}
          max={56}
          step={2}
          onValueChange={(v) => onChange({ fontSize: v[0] })}
        />
      </SettingCard>

      <SettingCard title="Chunk size" desc={`Group ${settings.chunkSize} verses per page`}>
        <Slider
          value={[settings.chunkSize]}
          min={1}
          max={10}
          step={1}
          onValueChange={(v) => onChange({ chunkSize: v[0] })}
        />
      </SettingCard>

      <SettingCard title="Display">
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="trans" className="text-sm">Show translation</Label>
          <Switch id="trans" checked={settings.showTranslation} onCheckedChange={(c) => onChange({ showTranslation: c })} />
        </div>
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="translit" className="text-sm">Show transliteration</Label>
          <Switch id="translit" checked={settings.showTransliteration} onCheckedChange={(c) => onChange({ showTransliteration: c })} />
        </div>
      </SettingCard>

      <SettingCard title="Reset" desc="This will clear all your verse statuses and progress.">
        <Button variant="destructive" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset progress
        </Button>
      </SettingCard>
    </div>
  );
}

function SettingCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}