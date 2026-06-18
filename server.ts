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
} from "./src/config/ai-slop-database";
import {
  GEMINI_HARD_STOPS,
  BASE_PROSE_RULES,
  buildSlopAnalysisPrompt,
  buildVocabAnalysisPrompt,
  buildPolishPassagePrompt,
} from "./src/config/ai-prompts";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload size for transmitting long chapters
app.use(express.json({ limit: "15mb" }));

// Initialize GoogleGenAI SDK dynamically per request or fallback to ENV
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
      headers: {
        "User-Agent": "aistudio-build",
      },
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

// Wrapper for generateContent to retry (using same model or fallback options) if experiencing 503 or transient error.
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
          console.warn(`[Model: ${currentModel}] [Attempt ${attempt}/${maxRetriesPerModel}] failed with transient error: ${errorStr}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.floor(delay * 2);
        } else if (isRateLimit) {
          const rateLimitDelay = attempt * 2000;
          console.warn(`[Model: ${currentModel}] [Attempt ${attempt}/${maxRetriesPerModel}] received rate limit/quota error. Waiting ${rateLimitDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        } else {
          console.warn(`[Model: ${currentModel}] Encountered error: ${errorStr}. Trying next candidate model if available...`);
          break; // Try next model in list
        }
      }
    }
  }
  throw lastError || new Error("All fallback models failed to generate content.");
}

// Wrapper for generateContentStream to retry (using same model or fallback options) if experiencing 503 or transient error.
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
          console.warn(`[Model: ${currentModel}] (Stream) [Attempt ${attempt}/${maxRetriesPerModel}] failed with transient error: ${errorStr}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.floor(delay * 2);
        } else if (isRateLimit) {
          const rateLimitDelay = attempt * 2000;
          console.warn(`[Model: ${currentModel}] (Stream) [Attempt ${attempt}/${maxRetriesPerModel}] received rate limit/quota error. Waiting ${rateLimitDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        } else {
          console.warn(`[Model: ${currentModel}] (Stream) Encountered error: ${errorStr}. Trying next candidate model if available...`);
          break; // Try next model in list
        }
      }
    }
  }
  throw lastError || new Error("All fallback models failed to generate content stream.");
}

// 1. Live Check Endpoint
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

// 2. Stream Generation Endpoint (Chunked Response)
app.post("/api/generate-stream", async (req, res) => {
  const { prompt, systemInstruction } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Missing required parameter 'prompt'." });
    return;
  }

  // Check if API key is available
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

    const finalSystemInstruction = `You are a top, elite professional book and webnovel.com author. Your signature writing style is exceptionally engaging, clean, and immediately addictive for mobile phone readers. Your stories have high dialogue density, realistic human voice, and absolute clarity.

${GEMINI_HARD_STOPS}

${BASE_PROSE_RULES}`;

    const activeSystemInstruction = systemInstruction
      ? `${GEMINI_HARD_STOPS}\n\n${systemInstruction}`
      : finalSystemInstruction;

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

// 3. AI Slop Analyzer Endpoint
app.post("/api/analyze-slop", async (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Missing required parameter 'content'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({
      error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel in AI Studio settings or enter a custom override key in Settings under configuration."
    });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    
    // Utilize the prompt builder function imported from ai-prompts.ts
    const analysisPrompt = buildSlopAnalysisPrompt(content, "");

    const systemInstruction = `You are an aggressive AI-writing detector. Your job is NOT to evaluate literary quality — it is to forensically identify whether this text was written by an AI.

KEY PRINCIPLE: Clean, grammatically correct prose is the #1 hallmark of AI writing. A human author makes small imperfect choices. An AI produces smooth, logically structured, well-formatted output. Treat smoothness itself as a suspicious signal.

Hard rules:
- Score the text on the SLOP INDEX (0-100), where 0 is perfect human and 100 is pure AI slop.
- Apply positive score additions to the Slop Index for every AI fingerprint found (see calibration rules in the prompt).
- Produce SPECIFIC, CONCRETE issue flags with EXACT substring matches — not vague generic advice.
- Every suggestion must be a specific rewrite of the EXACT flagged text, not generic editorial advice.
- NEVER write a suggestion that is longer, more theatrical, or more descriptive than the original. A bloated poetic rewrite of a short original sentence is ITSELF AI slop and is forbidden.
- NEVER suggest replacing punchy short sentences (under 12 words) with purple prose.
- Flag the hero-template protagonist aggressively: any moment where the POV character is simultaneously calm + analytically correct + producing a cool line is an AI fingerprint.
- Return a highly accurate JSON response matching the schema.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: analysisPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2, // low temperature for precise matching
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { 
              type: Type.INTEGER, 
              description: "SLOP INDEX. Measures the amount of AI writing fingerprints. 0 to 20 = Genuinely Human (low slop index). 21 to 50 = Mostly Human (some AI smooth patterns). 51 to 75 = AI Fingerprints (noticeable AI patterns). 76 to 100 = AI Generated (unmistakably AI, heavy slop). Apply penalties by adding to the score: +8 per structural pattern found, +5 per classic slop marker, +15 if protagonist is calm/correct, +12 for repeating paragraph rhythms, +6 per cinematic AI vocab word." 
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                purpleProse: { type: Type.INTEGER, description: "Score for purple prose. 0 = clean active narration, 100 = saturated with flowery descriptions. Higher is worse." },
                adverbDensity: { type: Type.INTEGER, description: "Score for adverb usage. 0 = strong active verbs, 100 = flooded with adverbs. Higher is worse." },
                dialogueQuality: { type: Type.INTEGER, description: "Legacy dialogue quality score. 0 = organic, 100 = flat. Higher is worse." },
                pacing: { type: Type.INTEGER, description: "Legacy pacing score. 0 = dynamic, 100 = dragging. Higher is worse." },
                clicheCount: { type: Type.INTEGER, description: "Legacy cliché count score. 0 = unique, 100 = full of clichés. Higher is worse." },
                showVsTell: { type: Type.INTEGER, description: "Score for showing instead of telling. 0 = active immersive, 100 = pure exposition narration. Higher is worse." },
                verbosityAndFiller: { type: Type.INTEGER, description: "Score for verbosity and filler. 0 = concise, 100 = bloated. Higher is worse." },
                negationPatterns: { type: Type.INTEGER, description: "Score for negation contrast patterns ('not X, but Y'). 0 = none, 100 = heavy usage. Higher is worse." },
                dialogueFormulaic: { type: Type.INTEGER, description: "Score for formulaic/predictable dialogue tag rhythms. 0 = natural variation, 100 = highly formulaic. Higher is worse." },
                clicheIntensity: { type: Type.INTEGER, description: "Score for banned intensity words. 0 = none, 100 = high count. Higher is worse." },
                propOverdescription: { type: Type.INTEGER, description: "Score for over-describing minor background props. 0 = none, 100 = high count. Higher is worse." },
                pacingIssues: { type: Type.INTEGER, description: "Score for structural pacing issues (choppy staccato vs dense walls). 0 = none, 100 = severe. Higher is worse." }
              },
              required: [
                "purpleProse", "adverbDensity", "dialogueQuality", "pacing", "clicheCount", "showVsTell", 
                "verbosityAndFiller", "negationPatterns", "dialogueFormulaic", "clicheIntensity", "propOverdescription", "pacingIssues"
              ]
            },
            issues: {
              type: Type.ARRAY,
              description: "A list of specific offending sentences or clauses found in the original text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { 
                    type: Type.STRING, 
                    description: "One of: PurpleProse, Adverb, Dialogue, Pacing, Cliché, ShowVsTell, StructurePattern, CinematicVocab, HeroTemplate, WordRepetition, ImpactTemplate, VerbosityFiller" 
                  },
                  severity: { 
                    type: Type.STRING, 
                    description: "One of: Low, Medium, High" 
                  },
                  originalText: { 
                    type: Type.STRING, 
                    description: "The EXACT text snippet containing the issue. MUST be a literal substring from the input chapter." 
                  },
                  suggestions: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Exactly ONE highly realistic, simplified rewrite suggestion. Do not include multiple options." 
                  },
                  explanation: { 
                    type: Type.STRING, 
                    description: "Why this text is weak or clunky and how the suggested rewrite fixes it." 
                  }
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
    if (!bodyText) {
      throw new Error("Empty response received from Gemini.");
    }

    res.json(JSON.parse(bodyText.trim()));
  } catch (error: any) {
    console.error("Gemini slop analysis error:", error);
    res.status(500).json({ error: "Failed to analyze slop: " + error.message });
  }
});

// 3.5. Vocabulary Simplicity & Anti-Formal Checker Endpoint
app.post("/api/analyze-vocab", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: "Missing required parameter 'content'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({
      error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel in AI Studio settings or enter a custom override key in Settings under configuration."
    });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    // Utilize the prompt builder function imported from ai-prompts.ts
    const vocabPrompt = buildVocabAnalysisPrompt(content);

    const systemInstruction = `You are a high-end webnovel prose editor. Your single purpose is to identify overly formal, academic, stiff ("kaku"), or overly dramatic/theatrical vocabulary in the prose, and suggest simple, conversational, grounded everyday alternatives.
Return a very precise JSON response matching the requested schema. Ensure that "originalText" matches a physical substring from the manuscript EXACTLY.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: vocabPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1, // very low for exact string matching
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issues: {
              type: Type.ARRAY,
              description: "List of stiff/formal/academic issues in the chapter.",
              items: {
                type: Type.OBJECT,
                properties: {
                  originalText: {
                    type: Type.STRING,
                    description: "The EXACT sentence or clause in the raw content containing the stiff/academic word. MUST match character for character."
                  },
                  word: {
                    type: Type.STRING,
                    description: "The specific stiff, formal, or academic word/phrase to be changed (e.g. 'throat', 'visage', 'Nexus')."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Explicit explanation of why this word is too academic, stiff/formal, or edgy, and how simpler language yields higher readability."
                  },
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly ONE simpler, everyday, grounded human-sounding replacement option (matching the passage language). Do not include multiple options."
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
    if (!textOutput) {
      throw new Error("No response content from Gemini.");
    }

    res.json(JSON.parse(textOutput.trim()));
  } catch (error: any) {
    console.error("Gemini vocab analysis error:", error);
    res.status(500).json({ error: "Failed to analyze vocabulary simplicity: " + error.message });
  }
});

// 4. Custom Inline Polish Endpoint
app.post("/api/polish", async (req, res) => {
  const { text, instruction, contextStyle } = req.body;

  if (!text) {
    res.status(400).json({ error: "Missing required parameter 'text'." });
    return;
  }

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({
      error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel in AI Studio settings or enter a custom key in Settings."
    });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    // Utilize the prompt builder function imported from ai-prompts.ts
    const polishPrompt = buildPolishPassagePrompt(
      text,
      instruction || "Improve pacing, remove purple prose, and activate verbs.",
      contextStyle || "General Action Fantasy"
    );

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: polishPrompt,
      config: {
        systemInstruction: "You are a master line editor. Rewrite the provided text as requested. Return ONLY the new rewritten passage, with no introductory text, no conversational fillers, and no quotation marks around the final result. Keep the changes concise and tailored.",
        temperature: 0.7,
      },
    });

    res.json({ polishedText: response.text?.trim() || text });
  } catch (error: any) {
    console.error("Gemini polish error:", error);
    res.status(500).json({ error: "Failed to polish text: " + error.message });
  }
});

// 5. Intelligent Manuscript Timeline Generator
app.post("/api/generate-timeline", async (req, res) => {
  const { characters, locations, genre, synopsis, antiSlopRules } = req.body;

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({
      error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel in AI Studio settings or enter a custom key in Settings."
    });
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
Genre of the project: "${genre || "Fantasy/LitRPG"}"
Core Synopsis: "${synopsis || ""}"

We have the following cast members available for POV or involvement (DO NOT create new characters unless absolutely necessary; reuse these exact profiles):
${charactersList || "No characters defined yet in World Bible index."}

We have the following locations available (assign these exact IDs where applicable; do not invent new locations, tie chapters to these):
${locationsList || "No locations defined yet in World Bible index."}

Anti-Slop guidelines:
- ${rulesList || "Avoid purple prose. Avoid repetitive chapter patterns."}

Please output a structured JSON containing a 'chapters' list.`;

    const systemInstruction = `You are a legendary novel strategist. Your job is to output a 5-chapter outlines sequence in beautiful, compliant JSON format.
STRICT ANTI-SLOP STRUCTURAL RULES (CRITICAL PROMPT DIRECTIVES):
1. No Formulaic Scene Repetition! NEVER generate chapter sequences where the progression loop is identical (e.g. Character enters forest -> meets enemy NPC -> battles -> gets loot). Every chapter MUST have a completely distinct plot style:
   - Chapter 1: Logical Investigation / Intrigue. Protagonist deciphers clues or uncovers a hidden trap using wits.
   - Chapter 2: Sudden Tactical Setback or Loss. Protagonist is outsmarted, a piece of core equipment is damaged, or they suffer a heavy emotional/physical trade-off. This forces them to pivot.
   - Chapter 3: Psychological Pressure & Asymmetric Alliance. A tense, high-stakes dialogue or interrogation with an unpredictable rival or ambiguous mentor.
   - Chapter 4: High-Velocity Escape or High-Intensity Training Breakthrough. A dramatic sensory challenge or frantic escape from overwhelming forces.
   - Chapter 5: Logical Peaking Climax & Setup. A battle or confrontation that has been logically earned, resolving in a smart cliffhanger.
2. Direct Cause and Effect: Every single beat must be the direct result of a previous choice or action, never a random occurrence (e.g. do not use "Suddenly an assassin appears" without previous clues).
3. Underpinning Ground Truth: Strictly respect the novel's main story premise/synopsis. Integrate character goals, constraints, and limitations rather than giving them easy solutions.
4. No Shadow-Larping Dialogue Clichés: Avoid circular, vague dialogue and repetitive pacing structures. All characters must speak with clear, distinct intentions and logical motivation.
5. High Contrast Tension Levels: Vary absolute tension elements (e.g., Chapter 1: Medium, Chapter 2: High, Chapter 3: Low-Pressure, Chapter 4: High-Action, Chapter 5: Climax).
6. MANDATORY BEAT CONSTRAINTS — Every climax or power-use beat MUST include one of:
   - A physical cost: gear damaged, injury, resource depleted, power backfires
   - A wrong first instinct: character tries something, it fails, then pivots
   - An unresolved problem: new threat emerges DURING or immediately AFTER the win
   
   NEVER generate a beat where protagonist activates power → it works → scene ends clean.
   ❌ "Ryan activates Overdrive and defeats the Stalker"
   ✅ "Ryan activates Overdrive accidentally — arm locks, can't control output, beast gets thrown back but Ryan collapses from feedback. Wins by accident. Arm still burning when he runs."
7. Beat descriptions must be SPECIFIC enough to constrain the writer:
   ❌ "Ryan uses his new power to escape"
   ✅ "Ryan's gauntlet locks at 40% charge mid-fight — he can't fire again, has to use the Stalker's own momentum to throw it into the wall. Escapes with a dislocated shoulder."
8. Strictly map the provided Character IDs and Location IDs in your output where appropriate so they align with the local database structure.
9. Cliffhangers & Hooks: Every chapter outline must be planned to start with a high-impact hook beat (action, dialogue, or reaction, avoiding slow summaries) and end with a compelling cliffhanger beat that leaves critical stakes unresolved to make opening the next chapter irresistible.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: timelinePrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8, // modest high temperature for creativity, but strict structure
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapters: {
              type: Type.ARRAY,
              description: "Sequence of 5 chapters forming a rich story arc.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Engaging and punchy chapter title." },
                  pov: { type: Type.STRING, description: "Character selected as POV (MUST match one of the character names provided or 'Third Person')." },
                  locationId: { type: Type.STRING, description: "The exact ID of the location where this chapter occurs (MUST match one of the location IDs provided, or empty)." },
                  summary: { type: Type.STRING, description: "A 2-sentence summary of what happens in this chapter." },
                  beats: {
                    type: Type.ARRAY,
                    description: "Exactly 3 or 4 action beats making up the plot elements in sequential order.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING, description: "A detailed description of the plot beat (no generic, repetitive beats)." },
                        tension: { type: Type.STRING, description: "TensionLevel value: Low, Medium, High, or Climax" },
                        characterIds: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Visual or participating Character ID list (MUST reuse existing characters IDs provided)."
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
    if (!timelineText) {
      throw new Error("Empty response received from timeline generator.");
    }

    res.json(JSON.parse(timelineText.trim()));
  } catch (error: any) {
    console.error("Gemini timeline generator error:", error);
    res.status(500).json({ error: "Failed to generate timeline: " + error.message });
  }
});

// 6. AI Cast Profile Generator
app.post("/api/generate-character", async (req, res) => {
  const { genre, synopsis, existingNames } = req.body;

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({
      error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel in AI Studio settings or enter a custom key in Settings."
    });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    let prompt = `You are an expert novel character generator. Generate a unique major or minor character profile that fits perfectly and organically into the following book premise.
Genre: "${genre || "Fantasy"}"
Premise/Synopsis: "${synopsis || "No synopsis available."}"\n`;

    if (existingNames && existingNames.length > 0) {
      prompt += `Do NOT generate any character with these existing names: ${existingNames.join(", ")}. Ensure this character has unique connections, abilities, and origins.\n`;
    }

    prompt += `Make sure their names, powers, age, gender, and backstory are extremely rich, highly specific and authentic to the settings, avoiding typical generic clichés (e.g., if LitRPG/System apocalypse, give them custom class descriptors and stat-based limitations).

STRICT BAN ON CLICHÉ AI NAMES:
Do NOT generate names that are typical, overused, cliché AI-generated fantasy/sci-fi names. Under no circumstances should you name a character:
- Kael, Kaelen, Kaela, Kaelith, Kaelis
- Elara, Elowen, Elarian, Elora, Elia
- Lyra, Lysander, Lyrian, Lyric
- Aurelia, Aurelius, Aurora, Aurel
- Zephyr, Zephyrus, Zephyra
- Rowan, Ronan
- Seraphina, Serena
- Jax, Jaxon
- Valen, Valerius
- Aric, Alaric, Alden
- Sylvia, Sylvan
- Nova, Neo
- Aria, Arya
- Or any names very similar to these. Avoid generic fantasy-sounding 'elf' or 'space' names. Instead, generate names that are either realistic, setting-appropriate, or unique and grounded.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class novel director and character designer. Generate a character profile as beautiful, compliant JSON matching the requested schema. Strictly avoid cliché, overused AI fantasy/sci-fi names (like Kael, Elara, Lyra, Zephyr, Rowan, etc.). Make names grounded, setting-appropriate, and unique.",
        responseMimeType: "application/json",
        temperature: 0.85,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Full name of the character (creative, matching the world's naming cultures)." },
            aliases: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1 to 3 epithets, titles, or nicknames (e.g. 'The Frostbite Reaver', 'Zero-Sum Scholar')." },
            age: { type: Type.STRING, description: "Numerical or general age descriptor appropriate to their race/species." },
            gender: { type: Type.STRING, description: "Gender identity." },
            appearance: { type: Type.STRING, description: "Detailed physical description, clothing, posture, and defining marks (avoid purple prose eyes clichés!)." },
            personality: { type: Type.STRING, description: "Distinct personality traits, mental quirks, core beliefs, and fatal flaws." },
            backstory: { type: Type.STRING, description: "Deeply connected history explaining how they came to be in this world, tied directly to the novel's synopsis/rules." },
            arcGoal: { type: Type.STRING, description: "Their central driving motivation or personal struggle in the narrative." },
            powerLevel: { type: Type.STRING, description: "Description of their battle capabilities, magic, skills, level, or unique system classes." },
            affiliations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Guilds, factions, empires, or organizations they belong to." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 to 5 single-word conceptual tags (e.g., 'Mage', 'Vengeful', 'Anti-Hero')." }
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

// 7. AI Sector Location Generator
app.post("/api/generate-location", async (req, res) => {
  const { genre, synopsis, existingNames } = req.body;

  if (!hasAPIKeyForRequest(req)) {
    res.status(400).json({
      error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel in AI Studio settings or enter a custom key in Settings."
    });
    return;
  }

  try {
    const ai = getAIForRequest(req);
    let prompt = `You are an expert fantasy/SF worldbuilder. Generate a unique sector, territory, zone, or setting location that fits perfectly and organically into the following book premise.
Genre: "${genre || "Fantasy"}"
Premise/Synopsis: "${synopsis || "No synopsis available."}"\n`;

    if (existingNames && existingNames.length > 0) {
      prompt += `Do NOT generate any location with these existing names: ${existingNames.join(", ")}. Ensure this location has unique layouts, dangers, and atmosphere.\n`;
    }

    prompt += `Make sure its name, visual features, atmosphere and rules are highly original and immersive, rather than standard copy-paste settings (e.g., if Xianxia, give it spiritual aura density variations and historical sects relics).`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master worldbuilder and environment designer. Generate a spectacular location profile as beautiful, compliant JSON matching the requested schema.",
        responseMimeType: "application/json",
        temperature: 0.85,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Authentic, high-concept setting or zone name." },
            description: { type: Type.STRING, description: "Vivid description of its geography, physical layouts, structures, and mystical elements." },
            atmosphere: { type: Type.STRING, description: "Visual and tactile atmosphere only (e.g., light quality, wind intensity, ambient temperature). STRICTLY FORBID smell or fragrance descriptions." },
            notableFeatures: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 or 4 points of interest, dangerous local anomalies, structures, or landmarks here." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 to 4 single-word environment tags (e.g., 'Underground', 'Dungeon', 'Holy', 'Frozen')." }
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

// Start server and handle static files / Vite middleware
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
