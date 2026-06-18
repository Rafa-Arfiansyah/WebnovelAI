import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  getCinematicVocabString,
  getBannedIntensityString,
  getStockImpactString,
  getEnergyWordClusterString,
  getScoringPenaltyBlock,
  SUGGESTION_QUALITY_RULES,
  STRUCTURAL_PATTERN_RULES,
  AI_BUZZWORDS,
  ENERGY_WORD_MAX_PER_CHAPTER,
  ABSOLUTE_BANNED_WORDS,
} from "./src/config/ai-slop-database";
import {
  GEMINI_HARD_STOPS,
  BASE_PROSE_RULES,
  COMPLIANCE_ENFORCER,
  BEAT_EXPANSION_ENFORCER,
  buildSlopAnalysisPrompt,
  buildVocabAnalysisPrompt,
  buildPolishPassagePrompt,
} from "./src/config/ai-prompts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

function getAIForRequest(req: express.Request): GoogleGenAI {
  const customKey = req.headers["x-custom-gemini-key"];
  const apiKey = (customKey && typeof customKey === "string" && customKey.trim().length > 0)
    ? customKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your Secrets Panel or enter your custom override key in Settings.");
  }

  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
    },
  });
}

function hasAPIKeyForRequest(req: express.Request): boolean {
  const customKey = req.headers["x-custom-gemini-key"];
  const apiKey = (customKey && typeof customKey === "string" && customKey.trim().length > 0)
    ? customKey.trim()
    : process.env.GEMINI_API_KEY;
  return !!apiKey;
}

interface GenerateContentParams {
  model: string;
  contents: any;
  config?: any;
}



async function generateContentWithFallback(ai: any, params: GenerateContentParams) {
  const originalModel = params.model || "gemini-3.5-flash";
  const modelOptions = [
    originalModel,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash"
  ];

  const modelsToTry = Array.from(new Set(modelOptions));
  let lastError: any = null;
  let delay = 800;

  for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
    const currentModel = modelsToTry[mIndex];
    const maxRetriesPerModel = 2;

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const activeParams = { ...params, model: currentModel };
        return await ai.models.generateContent(activeParams);
      } catch (error: any) {
        lastError = error;
        const errorStr = String(error.message || error);
        const isTransient =
          errorStr.includes("503") ||
          errorStr.includes("Service Unavailable") ||
          errorStr.includes("UNAVAILABLE") ||
          errorStr.includes("BUSY") ||
          errorStr.includes("demand");

        const isRateLimit =
          errorStr.includes("429") ||
          errorStr.includes("RESOURCE_EXHAUSTED") ||
          errorStr.includes("quota") ||
          errorStr.includes("Quota") ||
          errorStr.includes("limit") ||
          errorStr.includes("Limit");

        if (isTransient) {
          console.warn(`[Model: ${currentModel}] [Attempt ${attempt}/${maxRetriesPerModel}] transient error. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.floor(delay * 2);
        } else if (isRateLimit) {
          const rateLimitDelay = attempt * 2000;
          console.warn(`[Model: ${currentModel}] [Attempt ${attempt}/${maxRetriesPerModel}] rate limit. Waiting ${rateLimitDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        } else {
          console.warn(`[Model: ${currentModel}] Error: ${errorStr}. Trying next model...`);
          break;
        }
      }
    }
  }
  throw lastError || new Error("All fallback models failed to generate content.");
}

async function generateContentStreamWithFallback(ai: any, params: GenerateContentParams) {
  const originalModel = params.model || "gemini-3.5-flash";
  const modelOptions = [
    originalModel,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash"
  ];

  const modelsToTry = Array.from(new Set(modelOptions));
  let lastError: any = null;
  let delay = 800;

  for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
    const currentModel = modelsToTry[mIndex];
    const maxRetriesPerModel = 2;

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const activeParams = { ...params, model: currentModel };
        return await ai.models.generateContentStream(activeParams);
      } catch (error: any) {
        lastError = error;
        const errorStr = String(error.message || error);
        const isTransient =
          errorStr.includes("503") ||
          errorStr.includes("Service Unavailable") ||
          errorStr.includes("UNAVAILABLE") ||
          errorStr.includes("BUSY") ||
          errorStr.includes("demand");

        const isRateLimit =
          errorStr.includes("429") ||
          errorStr.includes("RESOURCE_EXHAUSTED") ||
          errorStr.includes("quota") ||
          errorStr.includes("Quota") ||
          errorStr.includes("limit") ||
          errorStr.includes("Limit");

        if (isTransient) {
          console.warn(`[Model: ${currentModel}] (Stream) [Attempt ${attempt}/${maxRetriesPerModel}] transient error. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.floor(delay * 2);
        } else if (isRateLimit) {
          const rateLimitDelay = attempt * 2000;
          console.warn(`[Model: ${currentModel}] (Stream) [Attempt ${attempt}/${maxRetriesPerModel}] rate limit. Waiting ${rateLimitDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        } else {
          console.warn(`[Model: ${currentModel}] (Stream) Error: ${errorStr}. Trying next model...`);
          break;
        }
      }
    }
  }
  throw lastError || new Error("All fallback models failed to generate content stream.");
}

// 1. Health Check
app.get("/api/health", (req, res) => {
  const customKey = req.headers["x-custom-gemini-key"];
  const hasKey = !!process.env.GEMINI_API_KEY || (customKey && typeof customKey === "string" && customKey.trim().length > 0);
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    hasGlobalKey: !!process.env.GEMINI_API_KEY,
    hasOverrideKey: !!(customKey && typeof customKey === "string" && customKey.trim().length > 0),
    currentTime: new Date().toISOString()
  });
});

// 2. Stream Generation Endpoint
// FIX: GEMINI_HARD_STOPS now prepended to ALL system instructions, including custom ones.
// FIX: COMPLIANCE_ENFORCER added to reinforce rules mid-generation.
// FIX: BEAT_EXPANSION_ENFORCER added to prevent clean wins and beat-skipping.
app.post("/api/generate-stream", async (req, res) => {
  const { prompt, systemInstruction } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Missing required parameter 'prompt'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write("Error: GEMINI_API_KEY is missing. Please configure it in your AI Studio Secrets Panel or enter a custom key in Settings.");
    res.end();
    return;
  }

  try {
    const ai = getAIForRequest(req);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // HARD_STOPS always comes first, no matter what systemInstruction is passed in.
    // COMPLIANCE_ENFORCER + BEAT_EXPANSION_ENFORCER always appended at the end.
    const coreInstructions = `You are a top, elite professional book and webnovel.com author. Your signature writing style is exceptionally engaging, clean, and immediately addictive for mobile phone readers. Your stories have high dialogue density, realistic human voice, and absolute clarity.

${GEMINI_HARD_STOPS}

${BASE_PROSE_RULES}

${COMPLIANCE_ENFORCER}

${BEAT_EXPANSION_ENFORCER}`;

    const activeSystemInstruction = systemInstruction
      ? (systemInstruction.includes("SELF-VERIFICATION PROTOCOL")
          ? systemInstruction
          : `${GEMINI_HARD_STOPS}\n\n${systemInstruction}\n\n${COMPLIANCE_ENFORCER}\n\n${BEAT_EXPANSION_ENFORCER}`)
      : coreInstructions;

    const streamResponse = await generateContentStreamWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: activeSystemInstruction,
        temperature: 0.75,
      },
    });

    for await (const chunk of streamResponse) {
      const text = chunk.text || "";
      res.write(text);
    }
    res.end();
  } catch (error: any) {
    console.error("Gemini stream generation error:", error);
    res.write(`\n\n[API Error occurred while generating: ${error.message || error}]`);
    res.end();
  }
});

// 3. AI Slop Analyzer
app.post("/api/analyze-slop", async (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Missing required parameter 'content'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    const analysisPrompt = buildSlopAnalysisPrompt(content, "");

    const systemInstruction = `You are an aggressive AI-writing detector. Your job is NOT to evaluate literary quality — it is to forensically identify whether this text was written by an AI.

KEY PRINCIPLE: Clean, grammatically correct prose is the #1 hallmark of AI writing. A human author makes small imperfect choices. An AI produces smooth, logically structured, well-formatted output. Treat smoothness itself as a suspicious signal.

Hard rules:
- Score the text on the SLOP INDEX (0-100), where 0 is perfect human and 100 is pure AI slop.
- Apply positive score additions to the Slop Index for every AI fingerprint found.
- Produce SPECIFIC, CONCRETE issue flags with EXACT substring matches — not vague generic advice.
- Every suggestion must be a specific rewrite of the EXACT flagged text, not generic editorial advice.
- NEVER write a suggestion that is longer, more theatrical, or more descriptive than the original.
- NEVER suggest replacing punchy short sentences (under 12 words) with purple prose.
- Flag the hero-template protagonist aggressively: any moment where the POV character is simultaneously calm + analytically correct + producing a cool line is an AI fingerprint.
- Return a highly accurate JSON response matching the schema.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: analysisPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: {
              type: Type.INTEGER,
              description: "SLOP INDEX 0-100. Apply penalties: +8 per structural pattern, +5 per classic slop marker, +15 if protagonist always calm/correct, +12 for repeating paragraph rhythms, +6 per cinematic vocab word."
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                purpleProse: { type: Type.INTEGER, description: "0=clean, 100=saturated flowery. Higher is worse." },
                adverbDensity: { type: Type.INTEGER, description: "0=strong verbs, 100=flooded adverbs. Higher is worse." },
                dialogueQuality: { type: Type.INTEGER, description: "0=organic, 100=flat. Higher is worse." },
                pacing: { type: Type.INTEGER, description: "0=dynamic, 100=dragging. Higher is worse." },
                clicheCount: { type: Type.INTEGER, description: "0=unique, 100=full clichés. Higher is worse." },
                showVsTell: { type: Type.INTEGER, description: "0=active, 100=pure exposition. Higher is worse." },
                verbosityAndFiller: { type: Type.INTEGER, description: "0=concise, 100=bloated. Higher is worse." },
                negationPatterns: { type: Type.INTEGER, description: "0=none, 100=heavy. Higher is worse." },
                dialogueFormulaic: { type: Type.INTEGER, description: "0=natural, 100=formulaic. Higher is worse." },
                clicheIntensity: { type: Type.INTEGER, description: "0=none, 100=high. Higher is worse." },
                propOverdescription: { type: Type.INTEGER, description: "0=none, 100=high. Higher is worse." },
                pacingIssues: { type: Type.INTEGER, description: "0=none, 100=severe. Higher is worse." },
                cleanWinPattern: { type: Type.INTEGER, description: "0=always has cost/failure, 100=protagonist always wins cleanly with no cost. Higher is worse." },
              },
              required: [
                "purpleProse", "adverbDensity", "dialogueQuality", "pacing", "clicheCount", "showVsTell",
                "verbosityAndFiller", "negationPatterns", "dialogueFormulaic", "clicheIntensity",
                "propOverdescription", "pacingIssues", "cleanWinPattern"
              ]
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: "One of: PurpleProse, Adverb, Dialogue, Pacing, Cliché, ShowVsTell, StructurePattern, CinematicVocab, HeroTemplate, WordRepetition, ImpactTemplate, VerbosityFiller, CleanWin"
                  },
                  severity: { type: Type.STRING, description: "One of: Low, Medium, High" },
                  originalText: { type: Type.STRING, description: "EXACT substring from the input. Must match character for character." },
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "ONE realistic rewrite. Must be same length or shorter than original. No purple prose in suggestions."
                  },
                  explanation: { type: Type.STRING, description: "Why this is flagged and how the suggestion fixes it." }
                },
                required: ["category", "severity", "originalText", "suggestions", "explanation"]
              }
            }
          },
          required: ["overallScore", "scores", "issues"]
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) throw new Error("Empty response received from Gemini.");
    res.json(JSON.parse(bodyText.trim()));
  } catch (error: any) {
    console.error("Gemini slop analysis error:", error);
    res.status(500).json({ error: "Failed to analyze slop: " + error.message });
  }
});

// 3.5. Vocabulary Simplicity Checker
app.post("/api/analyze-vocab", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: "Missing required parameter 'content'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    const vocabPrompt = buildVocabAnalysisPrompt(content);

    const systemInstruction = `You are a high-end webnovel prose editor. Your single purpose is to identify overly formal, academic, stiff ("kaku"), or overly dramatic/theatrical vocabulary in the prose, and suggest simple, conversational, grounded everyday alternatives.
Return a very precise JSON response matching the requested schema. Ensure that "originalText" matches a physical substring from the manuscript EXACTLY.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: vocabPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalText: { type: Type.STRING, description: "EXACT sentence/clause. Must match character for character." },
                  word: { type: Type.STRING, description: "The specific stiff/formal word to replace." },
                  explanation: { type: Type.STRING, description: "Why this word is too formal/theatrical and how simpler language helps." },
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "ONE simpler, grounded replacement. No purple prose alternatives."
                  }
                },
                required: ["originalText", "word", "explanation", "suggestions"]
              }
            }
          },
          required: ["issues"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("No response content from Gemini.");
    res.json(JSON.parse(textOutput.trim()));
  } catch (error: any) {
    console.error("Gemini vocab analysis error:", error);
    res.status(500).json({ error: "Failed to analyze vocabulary simplicity: " + error.message });
  }
});

// 4. Passage Polish
// FIX: Now uses getBannedIntensityString() and getCinematicVocabString() from database
// instead of hardcoded word lists in buildPolishPassagePrompt.
app.post("/api/polish", async (req, res) => {
  const { text, instruction, contextStyle } = req.body;

  if (!text) {
    res.status(400).json({ error: "Missing required parameter 'text'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    const polishPrompt = buildPolishPassagePrompt(
      text,
      instruction || "Improve pacing, remove purple prose, and activate verbs.",
      contextStyle || "General Action Fantasy"
    );

    // FIX: Polish endpoint now also gets GEMINI_HARD_STOPS prepended.
    const polishSystemInstruction = `${GEMINI_HARD_STOPS}

You are a master line editor. Rewrite the provided text as requested.
Return ONLY the new rewritten passage, with no introductory text, no conversational fillers, and no quotation marks around the final result.
Keep the changes concise and tailored. Never make the rewrite longer or more theatrical than the original.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: polishPrompt,
      config: {
        systemInstruction: polishSystemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ polishedText: response.text?.trim() || text });
  } catch (error: any) {
    console.error("Gemini polish error:", error);
    res.status(500).json({ error: "Failed to polish text: " + error.message });
  }
});

// 5. Timeline Generator
// FIX: Beat constraint rules (rules 6-7) now enforced.
// FIX: Added BEAT_EXPANSION_ENFORCER to system instruction.
app.post("/api/generate-timeline", async (req, res) => {
  const { characters, locations, genre, synopsis, antiSlopRules } = req.body;

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const ai = getAIForRequest(req);

    const charactersList = (characters || []).map((c: any) =>
      `Character ID: ${c.id}, Name: ${c.name}, Aliases: ${c.aliases?.join(", ") || ""}, Age: ${c.age || "unspecified"}, Personality: ${c.personality || ""}, PowerLevel: ${c.powerLevel || ""}, Backstory: ${c.backstory || ""}, ArcGoal: ${c.arcGoal || ""}`
    ).join("\n");

    const locationsList = (locations || []).map((l: any) =>
      `Location ID: ${l.id}, Name: ${l.name}, Atmosphere: ${l.atmosphere || ""}, Description: ${l.description || ""}`
    ).join("\n");

    const rulesList = (antiSlopRules || []).join("\n- ");

    const timelinePrompt = `You are an expert novelist planner. Create a highly cohesive, engaging 5-chapter story timeline in a sequential arc.
Genre: "${genre || "Fantasy/LitRPG"}"
Core Synopsis: "${synopsis || ""}"

Cast (reuse these exact profiles — do not create new characters):
${charactersList || "No characters defined yet."}

Locations (assign exact IDs — do not invent new locations):
${locationsList || "No locations defined yet."}

Anti-Slop guidelines:
- ${rulesList || "Avoid purple prose. Avoid repetitive chapter patterns."}

Output a structured JSON with a 'chapters' list.`;

    const systemInstruction = `You are a legendary novel strategist. Output a 5-chapter outline sequence in compliant JSON format.

STRICT STRUCTURAL RULES:
1. No Formulaic Scene Repetition. Every chapter must have a completely distinct plot style:
   - Chapter 1: Logical Investigation / Intrigue.
   - Chapter 2: Sudden Tactical Setback or Loss.
   - Chapter 3: Psychological Pressure & Asymmetric Alliance.
   - Chapter 4: High-Velocity Escape or Training Breakthrough.
   - Chapter 5: Earned Climax & Cliffhanger Setup.

2. Direct Cause and Effect: Every beat must result from a previous choice or action.

3. Respect the synopsis: Integrate character goals and limitations. No easy solutions.

4. No vague dialogue clichés. All characters speak with clear intentions.

5. Vary tension levels: Chapter 1: Medium, Chapter 2: High, Chapter 3: Low-Pressure, Chapter 4: High-Action, Chapter 5: Climax.

6. MANDATORY BEAT CONSTRAINTS — Every climax or power-use beat MUST include ONE of:
   A. Physical cost: gear damaged, injury, resource depleted, power backfires
   B. Wrong first instinct: character tries something, it fails, then pivots
   C. Unresolved problem: new threat emerges DURING or immediately AFTER the win
   ❌ FORBIDDEN: "Ryan activates Overdrive and defeats the Stalker" (clean win, no cost)
   ✅ REQUIRED: "Ryan activates Overdrive — arm locks mid-fight, can't fire again, has to use the Stalker's momentum to throw it into the wall. Escapes with a dislocated shoulder."

7. Beat descriptions MUST be specific enough to constrain the writer:
   ❌ TOO VAGUE: "Ryan uses his power to escape"
   ✅ SPECIFIC: "Ryan's gauntlet locks at 40% charge — he can't fire again. Uses the Stalker's lunge momentum to redirect it into the wall. Arm won't close properly when he runs."

8. Map provided Character IDs and Location IDs exactly.

9. Every chapter: high-impact hook beat (action/dialogue/reaction) + compelling cliffhanger ending.

${BEAT_EXPANSION_ENFORCER}`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: timelinePrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapters: {
              type: Type.ARRAY,
              description: "Sequence of 5 chapters forming a rich story arc.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Punchy chapter title." },
                  pov: { type: Type.STRING, description: "POV character name (must match provided names or 'Third Person')." },
                  locationId: { type: Type.STRING, description: "Exact location ID from provided list, or empty." },
                  summary: { type: Type.STRING, description: "2-sentence summary of what happens." },
                  beats: {
                    type: Type.ARRAY,
                    description: "Exactly 3 or 4 sequential action beats. Each must be specific enough to constrain a writer.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: {
                          type: Type.STRING,
                          description: "Detailed beat description. Must specify what goes wrong, what costs what, or what new problem emerges. No generic beats allowed."
                        },
                        tension: { type: Type.STRING, description: "Low, Medium, High, or Climax" },
                        characterIds: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Character IDs involved. Must reuse existing IDs."
                        }
                      },
                      required: ["description", "tension", "characterIds"]
                    }
                  }
                },
                required: ["title", "pov", "summary", "beats"]
              }
            }
          },
          required: ["chapters"]
        }
      }
    });

    const timelineText = response.text;
    if (!timelineText) throw new Error("Empty response from timeline generator.");
    res.json(JSON.parse(timelineText.trim()));
  } catch (error: any) {
    console.error("Gemini timeline generator error:", error);
    res.status(500).json({ error: "Failed to generate timeline: " + error.message });
  }
});

// 6. Character Generator
app.post("/api/generate-character", async (req, res) => {
  const { genre, synopsis, existingNames } = req.body;

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    let prompt = `You are an expert novel character generator. Generate a unique character profile fitting this premise.
Genre: "${genre || "Fantasy"}"
Premise: "${synopsis || "No synopsis available."}"\n`;

    if (existingNames && existingNames.length > 0) {
      prompt += `Do NOT use these existing names: ${existingNames.join(", ")}.\n`;
    }

    prompt += `Make names, powers, age, gender, and backstory rich and specific. Avoid generic clichés.

BANNED NAMES — never use these or anything similar:
Kael, Kaelen, Kaela, Elara, Elowen, Elora, Lyra, Lysander, Aurelia, Aurelius, Aurora,
Zephyr, Rowan, Ronan, Seraphina, Jax, Jaxon, Valen, Valerius, Aric, Alaric,
Sylvia, Nova, Neo, Aria, Arya.
Generate names that are realistic, setting-appropriate, and grounded.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class novel director and character designer. Generate a character profile as compliant JSON. Strictly avoid cliché AI fantasy names. Make names grounded and unique.",
        responseMimeType: "application/json",
        temperature: 0.85,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
            age: { type: Type.STRING },
            gender: { type: Type.STRING },
            appearance: { type: Type.STRING },
            personality: { type: Type.STRING },
            backstory: { type: Type.STRING },
            arcGoal: { type: Type.STRING },
            powerLevel: { type: Type.STRING },
            affiliations: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "aliases", "age", "gender", "appearance", "personality", "backstory", "arcGoal", "powerLevel", "affiliations", "tags"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Empty response from character generator.");
    res.json(JSON.parse(outputText.trim()));
  } catch (error: any) {
    console.error("Gemini character generator error:", error);
    res.status(500).json({ error: "Failed to generate character: " + error.message });
  }
});

// 7. Location Generator
// FIX: atmosphere field now explicitly bans smell descriptions.
app.post("/api/generate-location", async (req, res) => {
  const { genre, synopsis, existingNames } = req.body;

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    let prompt = `You are an expert worldbuilder. Generate a unique location fitting this premise.
Genre: "${genre || "Fantasy"}"
Premise: "${synopsis || "No synopsis available."}"\n`;

    if (existingNames && existingNames.length > 0) {
      prompt += `Do NOT use these existing names: ${existingNames.join(", ")}.\n`;
    }

    prompt += `Make the name, visual features, and rules highly original. Avoid standard copy-paste settings.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master worldbuilder. Generate a spectacular location profile as compliant JSON.",
        responseMimeType: "application/json",
        temperature: 0.85,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            atmosphere: {
              type: Type.STRING,
              description: "Visual and tactile atmosphere ONLY: light quality, wind intensity, temperature, spatial scale. NEVER describe smells, scents, or fragrance. Not once."
            },
            notableFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "description", "atmosphere", "notableFeatures", "tags"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Empty response from location generator.");
    res.json(JSON.parse(outputText.trim()));
  } catch (error: any) {
    console.error("Gemini location generator error:", error);
    res.status(500).json({ error: "Failed to generate location: " + error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

startServer();