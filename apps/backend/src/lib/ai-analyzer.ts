import { generateText, Output } from "ai";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { z } from "zod";
import type { LanguageModel } from "ai";

// ─── Provider config ───────────────────────────────────

type AIProvider = "mistral" | "openai" | "google";

const provider = (process.env.AI_PROVIDER as AIProvider) || "mistral";

function getVisionModel(): LanguageModel {
  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(process.env.AI_VISION_MODEL || "gpt-5");
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google(process.env.AI_VISION_MODEL || "gemini-2.0-flash");
    }
    case "mistral":
    default: {
      const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });
      return mistral(process.env.AI_VISION_MODEL || "pixtral-12b-2409");
    }
  }
}


// ─── Date validation ──────────────────────────────────

/** Returns null if the date is in the future or invalid */
function rejectFutureDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  if (parsed > new Date()) return null;
  return date;
}

// ─── Image Analysis ────────────────────────────────────

const imageAnalysisSchema = z.object({
  imageKind: z
    .enum(["medal", "bib", "unknown"])
    .describe("Type of trophy in the image"),
  raceName: z.string().nullable().describe("Name of the race if visible"),
  country: z
    .string()
    .nullable()
    .describe("Country ISO 3166-1 alpha-2 code if identifiable"),
  city: z.string().nullable().describe("City where the race took place"),
  date: z
    .string()
    .nullable()
    .describe("Date of the race in YYYY-MM-DD format if visible"),
  sportKind: z
    .enum([
      "running",
      "trail",
      "triathlon",
      "cycling",
      "swimming",
      "obstacle",
      "other",
    ])
    .nullable()
    .describe("Sport discipline"),
  distance: z
    .string()
    .nullable()
    .describe("Race distance if visible (e.g. '42.195km', '10km')"),
  hasPornContent: z
    .boolean()
    .describe("Whether the image contains inappropriate content"),
});

export type ImageAnalysisResult = z.infer<typeof imageAnalysisSchema>;

export async function analyzeImage(
  imageUrl: string,
): Promise<ImageAnalysisResult> {
  const { output } = await generateText({
    model: getVisionModel(),
    maxRetries: 1,
    output: Output.object({ schema: imageAnalysisSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: new URL(imageUrl),
          },
          {
            type: "text",
            text: `Analyze this image of a race trophy (medal or bib number).

Extract all visible information:
- What type of trophy is it (medal or bib)?
- What is the race name?
- What country and city is it from?
- What date was the race?
- What sport discipline?
- What distance?

Special rules:
- If the race name contains "Challenge" (e.g. "Challenge Roth"), the sport is triathlon
- If the race name ends with "Man" (e.g. "Ironman", "Superman"), the sport is triathlon
- Dates should be in YYYY-MM-DD format
- Dates MUST be in the past — a race date can NEVER be in the future. Today is ${new Date().toISOString().split("T")[0]}. If the date you find is after today, return null.
- Country should be ISO 3166-1 alpha-2 code (e.g. "FR", "US", "DE")
- Also check if the image contains any inappropriate/pornographic content

Return null for any field you cannot determine from the image.`,
          },
        ],
      },
    ],
  });

  const result = output!;
  result.date = rejectFutureDate(result.date);
  return result;
}

// ─── Race Info Enrichment ─────────────────────────────

const raceInfoSchema = z.object({
  found: z.boolean().describe("Whether race info was found"),
  date: z.string().nullable().describe("The race date in YYYY-MM-DD format"),
  city: z.string().nullable().describe("City where the race took place"),
  country: z.string().nullable().describe("Country ISO 3166-1 alpha-2 code"),
  sport: z
    .enum(["running", "trail", "triathlon", "cycling", "swimming", "obstacle", "other"])
    .nullable()
    .describe("Sport discipline"),
  distance: z.string().nullable().describe("Race distance (e.g. '42.195km')"),
  raceName: z.string().nullable().describe("Corrected/full official race name"),
});

export type RaceInfoResult = z.infer<typeof raceInfoSchema>;

export async function searchRaceInfo(
  raceName: string,
  year: string,
  sportKind?: string | null,
  city?: string | null,
  country?: string | null,
): Promise<RaceInfoResult> {
  const google = getGoogleProvider();
  const model = google(process.env.AI_TEXT_MODEL || "gemini-2.0-flash");

  const locationParts = [city, country].filter(Boolean).join(", ");

  const { text } = await generateText({
    model,
    maxRetries: 1,
    temperature: 0,
    tools: { google_search: google.tools.googleSearch({}) },
    system: `Tu es un assistant spécialisé dans la recherche d'informations sur les courses sportives.

Utilise Google Search pour trouver toutes les informations disponibles sur une course. Cherche sur les sites officiels de la course, les calendriers sportifs, et les sites spécialisés.

IMPORTANT:
- Cherche la date EXACTE (jour, mois, année) de la course
- Cherche la ville et le pays où la course a lieu
- Identifie le sport (running, trail, triathlon, cycling, swimming, obstacle, other)
- Cherche la distance de la course
- Retourne le nom officiel complet de la course si tu le trouves
- Si la course a lieu sur plusieurs jours, retourne la date du premier jour
- Si tu ne trouves pas une info avec certitude, retourne null pour ce champ
- Ne fabrique JAMAIS de données
- Le format de date doit être YYYY-MM-DD
- La date DOIT être dans le passé — une date de course ne peut JAMAIS être dans le futur. Aujourd'hui: ${new Date().toISOString().split("T")[0]}. Si la date trouvée est après aujourd'hui, retourne null pour la date.
- Le pays doit être un code ISO 3166-1 alpha-2 (e.g. "FR", "US", "DE")

Réponds UNIQUEMENT avec un JSON:
{
  "found": true,
  "date": "2024-06-15",
  "city": "Paris",
  "country": "FR",
  "sport": "running",
  "distance": "42.195km",
  "raceName": "Marathon de Paris"
}

Ou si rien trouvé:
{ "found": false, "date": null, "city": null, "country": null, "sport": null, "distance": null, "raceName": null }`,
    prompt: `Recherche toutes les informations sur cette course:
- Nom: ${raceName}
- Année: ${year}
${sportKind ? `- Sport: ${sportKind}` : ""}
${locationParts ? `- Lieu: ${locationParts}` : ""}

Trouve la date précise, la ville, le pays, le sport, la distance et le nom officiel complet de cette course pour l'année ${year}.`,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = raceInfoSchema.parse(JSON.parse(jsonMatch[0]));
      result.date = rejectFutureDate(result.date);
      return result;
    }
  } catch {
    // Parsing failed
  }

  return {
    found: false,
    date: null,
    city: null,
    country: null,
    sport: null,
    distance: null,
    raceName: null,
  };
}

// ─── Race Date Refinement ─────────────────────────────

const raceDateSchema = z.object({
  found: z.boolean().describe("Whether a precise date was found"),
  date: z
    .string()
    .nullable()
    .describe("The race date in YYYY-MM-DD format"),
});

export async function searchRaceDate(
  raceName: string,
  year: string,
  sportKind?: string | null,
  city?: string | null,
  country?: string | null,
): Promise<string | null> {
  const google = getGoogleProvider();
  const model = google(process.env.AI_TEXT_MODEL || "gemini-2.0-flash");

  const locationParts = [city, country].filter(Boolean).join(", ");

  const { text } = await generateText({
    model,
    maxRetries: 1,
    temperature: 0,
    tools: { google_search: google.tools.googleSearch({}) },
    system: `Tu es un assistant spécialisé dans la recherche d'informations sur les courses sportives.

Utilise Google Search pour trouver la date exacte d'une course. Cherche sur les sites officiels de la course, les calendriers sportifs, et les sites spécialisés.

IMPORTANT:
- Cherche la date EXACTE (jour, mois, année) de la course
- Si la course a lieu sur plusieurs jours, retourne la date du premier jour
- Si tu ne trouves pas avec certitude, retourne found: false
- Ne fabrique JAMAIS de date
- Le format de date doit être YYYY-MM-DD
- La date DOIT être dans le passé — une date de course ne peut JAMAIS être dans le futur. Aujourd'hui: ${new Date().toISOString().split("T")[0]}. Si la date trouvée est après aujourd'hui, retourne found: false.

Réponds UNIQUEMENT avec un JSON:
{ "found": true, "date": "2024-06-15" }

Ou si non trouvé:
{ "found": false, "date": null }`,
    prompt: `Recherche la date exacte de cette course:
- Nom: ${raceName}
- Année: ${year}
${sportKind ? `- Sport: ${sportKind}` : ""}
${locationParts ? `- Lieu: ${locationParts}` : ""}

Trouve la date précise (jour et mois) de cette course pour l'année ${year}.`,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = raceDateSchema.parse(JSON.parse(jsonMatch[0]));
      if (parsed.found && parsed.date) {
        const validated = rejectFutureDate(parsed.date);
        if (validated) return validated;
      }
    }
  } catch {
    // Parsing failed
  }

  return null;
}

// ─── Race Results Search ───────────────────────────────

const raceResultsSchema = z.object({
  found: z.boolean().describe("Whether results were found"),
  time: z
    .string()
    .nullable()
    .describe("Finish time (e.g. '3:45:12' or '01:23:45')"),
  ranking: z.number().nullable().describe("Overall ranking/position"),
  categoryRanking: z.number().nullable().describe("Category ranking"),
  totalParticipants: z.number().nullable().describe("Total participants"),
  source: z
    .string()
    .nullable()
    .describe("Source website where results were found"),
});

export type RaceResultsSearchResult = z.infer<typeof raceResultsSchema>;

function getGoogleProvider(): GoogleGenerativeAIProvider {
  return createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
}

export async function searchRaceResults(
  firstName: string,
  lastName: string,
  raceName: string,
  sportKind: string,
  date?: string | null,
  city?: string | null,
  country?: string | null,
): Promise<RaceResultsSearchResult> {
  const google = getGoogleProvider();
  const model = google(process.env.AI_TEXT_MODEL || "gemini-2.0-flash");

  const dateInfo = date || "";
  const locationParts = [city, country].filter(Boolean).join(", ");

  const prompt = `Recherche les résultats de course pour:
- Coureur: ${firstName} ${lastName}
- Course: ${raceName}
${dateInfo ? `- Date: ${dateInfo}` : ""}
${sportKind ? `- Sport: ${sportKind}` : ""}
${locationParts ? `- Lieu: ${locationParts}` : ""}

Cherche sur les sites de résultats (Chronorace, LiveTrail, FFA, ITRA, Gravel, Hyrox,FFC, raceresult, my.raceresult, Vélo résultats officiels de la course) et retourne les résultats pour cette personne exacte.`

  console.log(SEARCH_SYSTEM_PROMPT);
  console.log(prompt);

  const { text } = await generateText({
    model,
    maxRetries: 1,
    temperature: 0,
    tools: { google_search: google.tools.googleSearch({}) },
    system: SEARCH_SYSTEM_PROMPT,
    prompt,
  });

  // Parse the JSON from the response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = raceResultsSchema.parse(JSON.parse(jsonMatch[0]));
      return parsed;
    }
  } catch {
    // Parsing failed
  }

  return {
    found: false,
    time: null,
    ranking: null,
    categoryRanking: null,
    totalParticipants: null,
    source: null,
  };
}

const SEARCH_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans la recherche de résultats de courses sportives.

Utilise Google Search pour trouver les résultats officiels. Cherche sur les sites spécialisés: Chronorace, LiveTrail, FFA, ITRA, L-Chrono, bases de résultats officielles.

IMPORTANT:
- Cherche la personne EXACTE (prénom + nom)
- Si tu ne trouves pas avec certitude, retourne found: false
- Ne fabrique JAMAIS de données
- ranking = position au classement général (nombre entier, pas "42/1500")
- categoryRanking = position dans sa catégorie (nombre entier)
- totalParticipants = nombre total de participants (nombre entier)
- time = temps de course (format "HH:MM:SS" ou "H:MM:SS")

Réponds UNIQUEMENT avec un JSON:
{
  "found": true,
  "time": "3:45:12",
  "ranking": 42,
  "categoryRanking": 5,
  "totalParticipants": 1500,
  "source": "https://example.com/results"
}

Ou si non trouvé:
{ "found": false, "time": null, "ranking": null, "categoryRanking": null, "totalParticipants": null, "source": null }`;
