import { useQuery } from "@tanstack/react-query";

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
  { id: "ar.alafasy", name: "Mishary Alafasy" },
  { id: "ar.husary", name: "Mahmoud Al-Husary" },
  { id: "ar.minshawi", name: "Mohamed Al-Minshawi" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
  { id: "ar.hudhaify", name: "Ali Al-Hudhaify" },
];

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  audio?: string;
}

interface ApiSurah {
  ayahs: ApiAyah[];
}

interface ApiResponse {
  data: ApiSurah[];
}

export function useYaseen(reciter: string) {
  return useQuery({
    queryKey: ["yaseen", reciter],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<Ayah[]> => {
      const url = `https://api.alquran.cloud/v1/surah/36/editions/${reciter},en.sahih,en.transliteration`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load Surah Yaseen");
      const json = (await res.json()) as ApiResponse;
      const [arabicEd, translationEd, translitEd] = json.data;
      return arabicEd.ayahs.map((a, i) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        arabic: a.text,
        translation: translationEd.ayahs[i]?.text ?? "",
        transliteration: translitEd.ayahs[i]?.text ?? "",
        audio: a.audio ?? "",
      }));
    },
  });
}