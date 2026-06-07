import { createFileRoute } from "@tanstack/react-router";
import { YaseenApp } from "@/components/yaseen/YaseenApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noor — Memorize Surah Yaseen" },
      { name: "description", content: "Learn, listen, and memorize Surah Yaseen with a calm, interactive companion." },
      { property: "og:title", content: "Noor — Memorize Surah Yaseen" },
      { property: "og:description", content: "Learn, listen, and memorize Surah Yaseen with a calm, interactive companion." },
    ],
  }),
  component: Index,
});

function Index() {
  return <YaseenApp />;
}
