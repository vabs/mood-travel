import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const moods = await getCollection("moods");
  const synonyms = await getCollection("synonyms");

  const body = {
    moods: moods.map((m) => ({ id: m.data.id, label: m.data.label })),
    synonyms: synonyms.map((s) => ({
      term: s.data.term,
      candidates: s.data.candidates.map((c) => ({ moodId: c.mood_id.id, confidence: c.confidence })),
    })),
  };

  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};
