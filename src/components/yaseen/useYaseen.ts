import { useQuery } from "@tanstack/react-query";
import yaseenData from "@/data/yaseen.json";

export interface Ayah {
  number: number;
  numberInSurah: number;
  arabic: string;
  translation: string;
  transliteration: string;
  audio: string;
}

export interface ReciterOption {
  id: string;
  name: string;
}

export const RECITERS: ReciterOption[] = [
  { id: "ar.alafasy", name: "Mishary Alafasy (offline)" },
];

interface LocalAyah {
  number: number;
  numberInSurah: number;
  arabic: string;
  translation: string;
  transliteration: string;
}

export function useYaseen(reciter: string) {
  return useQuery({
    queryKey: ["yaseen", reciter],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async (): Promise<Ayah[]> => {
      // All text + audio are bundled with the app — zero network needed.
      return (yaseenData as LocalAyah[]).map((a) => ({
        ...a,
        audio: `/audio/yaseen/${a.number}.mp3`,
      }));
    },
  });
}