import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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

    const finalSystemInstruction = `You are a top, elite professional book and webnovel.com author. Your signature writing style is exceptionally fast-paced, highly engaging, clean, and immediately addictive for mobile phone readers. Your stories have high dialogue density, realistic human voice, and absolute clarity.

=========================================
CRITICAL WRITING DIRECTIVES (STRICT COMPLIANCE REQUIRED):

1. WEBNOVEL MICRO-PARAGRAPH FORMATTING (SANGAT PENTING):
- Paragraphs MUST be extremely tiny, with a STRICT maximum of 1 to 3 sentences per paragraph (1-3 sentences max).
- Break paragraphs frequently. Mobile scrolling readers read line-by-line; dense blocks of text of 4 or more sentences are strictly forbidden. Make it clean, punchy, and spaced out.

2. BAHASA SEDERHANA & SEKALI BACA LANGSUNG MENGERTI (NO PURPLE PROSE / NO COMPLEX EXPOSITION):
- Write in ultra-transparent, plain, simple language that is instantly clear upon a single reading.
- Do NOT use poetic, cinematic, or over-decorated sentences. Avoid fancy metaphors, heavy background exposition, and tedious descriptions.
- Keep the syntax fresh, direct, and straightforward. Skip the fluff or academic vocabulary. Prefer simple, direct nouns and active verbs.
- ABSOLUTE BAN ON OVER-DESCRIBING BACKGROUND PROPS: Never decorate minor scenery objects with redundant descriptions or adjectives (e.g., Avoid writing: "rusted hydraulics", "hidrolik yang berkarat", "rusted skeleton of the excavator", "weathered metal", "decaying fence", "besi tua yang berdebu"). The reader does not care about these. Simply write "hydraulics" or "excavator" (or "ekskavator", "hidrolik", "pagar"). Keep minor objects completely plain without decoration.

3. ABSOLUTE BAN ON NEGATIVE-CONTRASTS / NEGATED COMPARISONS (DILARANG KERAS POLA NEGASI):
- Under no circumstances write negative contrast patterns or negation comparisons (e.g., "did not warm", "did not rush", "was not merely", "was not hungry", "tidak hangat", "tidak terburu-buru", "bukan sekadar X, melainkan Y", "tidak hanya X, melainkan Y", "bukan hanya X, tetapi juga Y").
- DO NOT say what is "not" happening, what something is "not" doing, or what a character does "not" do to set a scene, pacing, or emotion.
- Example of FAIL: "The purple light did not warm the room." -> PASS: "The purple light felt cold against the walls."
- Example of FAIL: "He did not rush." -> PASS: "He took his time", "He worked slowly."
- Example of FAIL: "She wasn't merely sad..." -> PASS: "An overwhelming sorrow crushed her."
- Always state directly, positively, and actively what IS happening or what IS there.

4. ABSOLUTE BAN ON WORDY WORLD INFO-DUMPING & META-EXPOSITION:
- NEVER insert sentences explaining the world lore, background history of regions, classification systems, tier definitions, or why a place is dangerous (e.g., Avoid sentences like: "This was the heart of the Rustlands...", "In Sector 4, rushing got you...", "for an F-tier hunter, it was...", "That region was ruined by the fallout...").
- Let characters operate organically without narrator-led history lectures. Show active visual progress and thoughts, not textbook descriptions.

5. ABSOLUTE BAN ON REPETITIVE DIALOGUE ATTRIBUTION, FORMULAIC ACTION-TAGGING & STIFF SENTENCES:
- DILARANG KERAS menggunakan pola penulisan dialog monoton yang terus berulang seperti:
  * Pattern A: "[Dialogue]," said characters while [action]. (e.g., "Aku baik saja," kata Ryan sambil membersihkan dahi.)
  * Pattern B: [Action]. "[Dialogue]". (e.g., Ryan membersihkan dahi. "Aku baik saja.")
- These formulaic structures on every turn make the text look incredibly repetitive, clinical, and artificial ("kaku").
- Let conversation flow dynamically and casually ("mengalir natural, santai"). Use TAGLESS DIALOGUE where characters speak directly back and forth WITHOUT needing speech tags ("said", "asked") or forced physical ticks/actions on every single line of dialogue.
- Introduce natural spoken contractions and slang (don't, can't, sih, kok, kan, dong, lho, ya, aja, deh) to make the dialogue feel deeply human and alive.

6. NEVER DESCRIBE SMELLS OR AMBIENT ODORS (NEVER DESCRIBE SMELL):
- Absolute ban on describing the smell of locations, rooms, air, perfume, body odor, or general olfactory atmospheres. Focus on tactile, visual, sound, or immediate mental thoughts.

7. IMMEDIATE "IN-FRAME" INITIATION (NO SCENERY PANNING OR WEATHER PULLS):
- NEVER start chapters or scenes with descriptions of weather, purple lights, sunset, dunes stretching out, or setting ambience. Start immediately with active, immediate human prose: a line of spoken dialogue, immediate active physical task movement, or direct mental reaction.

8. ABSOLUTE BAN ON CLICHÉ INTENSITY WORDS:
- Never use: "palpable", "piercing", "ethereal", "crimson" (use "red" or describe organically), "echoed", "shiver ran down", "eyes widened", "heart hammered", "swallowed hard", "heavy silence" (never use "heavy" or "heavily" to describe abstract state of mind).
=========================================`;

    const streamResponse = await generateContentStreamWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.85,
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
    
    const analysisPrompt = `You are an expert webnovel editor, stylistic polish master, and aggressive "anti-slop" writing coach.
Analyze the following raw webnovel chapter content for "AI slop" style markers, poor pacing, cliches, or prose errors. 

STRICT AI SLOP SIGNATURE MARKERS TO FLAG AND REJECT:
1. AI Buzzword, Pretentious Vocabulary, or Filler Fatigue:
   - Words like: "delve", "tapestry", "gaze/orbs", "testament", "intricate", "beacon", "dangerous dance", "complex web", "multifaceted", "clandestine", "symphony of", "whispering secrets", "crescendo", "pivotal", "catalyst", "ultimate", "not only... but also", "a sense of...".
   - Overly theatrical, overly dramatic, or self-consciously "edgy" vocabulary where standard words work better (e.g. using anatomical exaggeration like "blade to his throat" when "blade to his neck" is more natural and grounded, or using verbs like "skewered/slit/groaned" excessively to simulate drama).
2. Wordy "Not X, just Y" / "Not X, but Y" Contrast Clichés:
   - Phrases matching: "Not [emotion], but [emotion]..." (e.g. "Not anger, but fear...", "It wasn't a warning, just an instruction...", " Bukan kemarahan, melainkan..."). These are classic AI filler markers that delay the actual description. Flag them aggressively and rewrite them to be direct and active.
3. Repetitive Introductory Structures:
   - Beginning multiple sentences with: "With a [adjective] [noun], he/she [verb]..." (e.g., "With a soft sigh, he turned...").
   - Opening too many sentences with participles: "Glancing/Nodding/Sighing, they...".
4. Over-described Smell and Sensory Trivia (Bertele-tele):
   - Over-describing non-essential details like background smells, air temperatures, or minute physical orientations in a verbose, artificial manner. Flag lines that beat around the bush ("bertele-tele") rather than keeping it simple, active, and direct.
5. "Designed" / Overly Functional Dialogue:
   - Dialogue that sounds too clinical, efficient, perfect, or overly designed (e.g., cool movie-trailer quotes like "Ten seconds is plenty"). Real human dialogue is messy, spontaneous, has interruptions, trailing thoughts, stuttering, informal pacing, random vocal habits, or character leaks. Flag dialogue that feels too perfectly stage-managed.
6. Telling Instead of Showing (Exposition-heavy text):
   - Highlighting when a character's state, stress, or tension is summarized by the narrator instead of shown through immediate physical action, sensory perception, or clear choice.
7. Weak Passive Auxiliary Verbs:
   - "began to walk", "was starting to feel", "couldn't help but feel", "there was a sense of..." - change these to active, sensory details.
8. Shadow-Larping Narrative Wrapups:
   - Generic "only time would tell" or "this was just the beginning of what was to come" final clauses that lack substance.

Analyze the content rigorously. Ensure the "originalText" of any flagged issues matches the substring from the chapter content EXACTLY (character for character, down to quotes/punctuation). Provide EXACTLY ONE highly polished, natural, human-sounding, and direct rewrite suggestion. Avoid providing multiple options; give only the single best way to simplify and state the prose actively. Keep the suggestions array filled with exactly 1 string element.

Raw Content:
"""
${content}
"""`;

    const systemInstruction = `You are a master, high-end editorial consultant specializing in serial webnovels (Royal Road, Webnovel.com).
Your goal is to purge AI writing style clichés: repetitive sentence openings, weak passive voice, information dumps, and safe, generic filler phrases like 'delve' or 'shiver ran down'.
You must return a highly accurate JSON response matching the requested schema. Ensure that "originalText" in issues matches EXACTLY a physical substring from the content, so the UI can highlight and replace it without crashing.`;

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
              description: "Overall rating on how high-quality and human-sounding the prose is, from 0 (terrible slop) to 100 (polished work of art)." 
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                purpleProse: { type: Type.INTEGER, description: "Score for purple prose. 100 = descriptive but active/clean, 0 = saturated with cheesy adjectives." },
                adverbDensity: { type: Type.INTEGER, description: "Score for adverb usage. 100 = strong verbs, 0 = flooded with -ly adverbs." },
                dialogueQuality: { type: Type.INTEGER, description: "Score for dialogue naturalness and pacing. 100 = organic and interesting, 0 = flat or infodump dialogues." },
                pacing: { type: Type.INTEGER, description: "Score for text speed and rhythm. 100 = smooth pacing, 0 = dragging scenes or rushed climax." },
                clicheCount: { type: Type.INTEGER, description: "Score for avoiding cliches and trope over-indulgence. 100 = distinctive and engaging, 0 = carbon-copy tropes." },
                showVsTell: { type: Type.INTEGER, description: "Score for showing instead of telling. 100 = active immersive scenes, 0 = pure exposition narration." }
              },
              required: ["purpleProse", "adverbDensity", "dialogueQuality", "pacing", "clicheCount", "showVsTell"]
            },
            issues: {
              type: Type.ARRAY,
              description: "A list of specific offending sentences or clauses found in the original text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { 
                    type: Type.STRING, 
                    description: "One of: PurpleProse, Adverb, Dialogue, Pacing, Cliché, ShowVsTell" 
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
      const vocabPrompt = `You are a professional editor specializing in purifying webnovel manuscripts for readability, simplicity, and tone cohesion.
Analyze the following raw webnovel chapter content for words and phrases that are:
- Too academic (e.g. "coruscating", "conflagration", "pulchritudinous", "nexus", "visage").
- Too formal, stiff, or rigid ("kaku") for casual reading (e.g. using Indonesian formal connectives in high-energy scenes, or overly clinical descriptions).
- Overly dramatic or theatrical (e.g. using "throat" when "neck" is much simpler/natural, or writing "skewered his abdomen" when "stabbed him" works perfectly).
- Pretentious terms or AI slop words that normal people do not use spontaneously.

Your goal is to keep the language down-to-earth, natural, simple, cohesive, and easy to understand.
For every issue found, identify the specific stiff word/phrase, provide a plain explanation, and propose EXACTLY ONE simpler, grounded, everyday Indonesian or English alternative (matching the source language). Avoid providing multiple options; give only the single most suitable direct replacement. Keep the suggestions array filled with exactly 1 string element.

Ensure that "originalText" matches EXACTLY a physical substring within the content (down to capitalization, quotes, and spacing) so the UI can highlight and replace it cleanly.

Raw Content:
"""
${content}
"""`;

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
    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: `Improve the style of this webnovel passage according to these instructions:
Passage to rewrite: "${text}"
Instruction: "${instruction || "Improve pacing, remove purple prose, and activate verbs."}"
Context/Tone style to apply: "${contextStyle || "General Action Fantasy"}"`,
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
6. Strictly map the provided Character IDs and Location IDs in your output where appropriate so they align with the local database structure.`;

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

    prompt += `Make sure their names, powers, age, gender, and backstory are extremely rich, highly specific and authentic to the settings, avoiding typical generic clichés (e.g., if LitRPG/System apocalypse, give them custom class descriptors and stat-based limitations).`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class novel director and character designer. Generate a character profile as beautiful, compliant JSON matching the requested schema.",
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
            atmosphere: { type: Type.STRING, description: "Sensory atmospheric details (e.g., light quality, winds, smell, environmental essence)." },
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
