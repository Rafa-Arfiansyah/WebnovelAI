// src/config/ai-prompts.ts

import { Chapter, Character, Location } from "../types";

// ─────────────────────────────────────────────
// SYSTEM: Base prose rules yang selalu dipakai
// ─────────────────────────────────────────────
export const BASE_PROSE_RULES = `
CRITICAL WEBNOVEL WRITING RULES — STRICT COMPLIANCE REQUIRED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — PARAGRAPH RHYTHM & EASY FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keep paragraphs short. Hard cap: 4 sentences maximum per paragraph, no exceptions.
But paragraph length is not the end goal—SMOOTH RHYTHMIC FLOW IS.

- Vary paragraph lengths intentionally to maintain natural pacing.
- Avoid stacking multiple ultra-short 1-sentence paragraphs back-to-back if they describe a single continuous action; combine them so the story flows gracefully.
- Break up text naturally, but keep consecutive beats cohesive. Do not artificially fragment ideas that belong together.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — DECORATION-FREE PLAIN LANGUAGE (NO POETIC, NO CINEMATIC, NO METAPHORS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write in language that is instantly clear, transparent, and simple on a single read.

- NO POETIC WRITING: Absolutely no beautiful, flowery, ornate, or poetic language. Keep the styling clean and dry.
- NO CINEMATIC SETTINGS: Do not write cinematic landscape panning, romantic color shifts, or heavy environmental mood-setting.
- NO METAPHORS & COMPARISONS: Avoid descriptive metaphors or analogies (e.g., do not say "silence felt like a cold blanket", "eyes like coals", or "his heart felt like a hammered drum"). State the physical reality directly and plainly.
- Use simple everyday nouns, active direct verbs, and straightforward syntax. If a sentence feels like a fancy novel, simplify it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3 — NO DECORATING BACKGROUND PROPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Minor scenery objects get zero adjectives. Do not dress up background items.

BANNED: "rusted hydraulics", "weathered metal", "decaying fence", "crumbling walls", "battered crate", "jagged stone plates", "charcoal hair"
CORRECT: "hydraulics", "metal", "fence", "walls", "crate", "stone plates", "hair"

The reader does not care about the texture or state of background objects. If it is not plot-critical, keep it completely plain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4 — NO NEGATION PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never describe what is NOT happening, what someone is NOT doing, or what is NOT there. Always state directly, positively, and actively what IS happening or what IS there.

BANNED patterns:
- "did not warm" / "did not rush" / "was not merely"
- "tidak hangat" / "tidak terburu-buru"
- "bukan sekadar X, melainkan Y"
- "tidak hanya X, tetapi juga Y"

FAIL: "The light did not warm the room." -> PASS: "The light felt cold against the walls."
FAIL: "He did not rush." -> PASS: "He moved slowly." or "He took his time."
FAIL: "She wasn't merely sad..." -> PASS: "An overwhelming sorrow crushed her."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 5 — DIALOGUE: NATURAL FLOW, NOT FORMULAIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avoid repetitive or formulaic dialogue tag patterns.

BANNED A: "[Dialogue]," kata X sambil [action].
BANNED B: [Action]. "[Dialogue]."

Using either pattern repeatedly makes prose feel robotic. Instead, use:
- TAGLESS dialogue where characters speak back and forth with zero voice tags.
- DETACHED ACTION BEATS where a character acts, then speaks in separate, distinct thoughts or paragraphs.
- NATURAL SPOKEN REGISTER: Use genuine spoken contractions and conversational particles (English: don't, can't, I've, you're; Indonesian: sih, kok, kan, dong, lho, ya, aja, deh, tuh) to make speech sound alive and natural.
- NO PHYSICAL TICKS ON EVERY LINE: Characters should not cross their arms, sigh, wipe their forehead, or nod every time they open their mouth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 6 — NO SMELL DESCRIPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zero olfactory descriptions. Do not describe smells, odors, perfume, air scent, body odor, or fragrance. Focus on: tactile, visual, sound, or immediate tactical thinking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 7 — START IN THE FRAME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never open a chapter or scene with weather, light angles, landscape panning, or mood setting. Open immediately on page one, sentence one with:
- A line of raw spoken dialogue, or
- An active physical task already in progress, or
- An immediate direct internal thought.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 8 — BANNED INTENSITY WORDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These words are permanently banned:
palpable / piercing / ethereal / crimson / echoed / shiver ran down / eyes widened / heart hammered / swallowed hard / heavy silence / heavily (when describing abstract emotions)

Use direct words: never use "crimson", simply write "red". Do not use "heavy silence", state what the characters are actually doing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 9 — SENTENCE COHESION & FLOW (STRICTLY AVOID ARTIFICIAL SENTENCE FRAGMENTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Absolutely do NOT chop continuous, single-concept lines of action or physical movements into short, robotic, artificial staccato sentence fragments. The narration must flow smoothly and be easy to understand.

Combine related actions or immediate gestures into fluid, cohesive sentences using participles, subordinate clauses, or natural coordinating punctuation. Do not write a series of choppy 2-word sentences for simple gestures.

FAIL (Choppy/Artificially fragmented):
He stood. His chest heaved. His eyes burned with red light.

PASS (Cohesive/Flowing/Easy to understand):
He stood, his chest heaving, his eyes burning with a residual red light.

Always make sure the text flows naturally, maintains high readability, and reads effortlessly upon a single reading.`;

// ─────────────────────────────────────────────
// CHAPTER GENERATION PROMPT
// ─────────────────────────────────────────────
interface ChapterPromptParams {
  chapter: Chapter;
  characters: Character[];
  location: Location | undefined;
  precedingChapters: Chapter[];
  wordCountTarget: number;
  toneAdjustment: string;
  activePreset: string;
  customInst: string;
  projectRules: string[];
  mimicStyleText: string;
}

export function buildChapterGenerationPrompt(params: ChapterPromptParams): string {
  const {
    chapter,
    characters,
    location,
    precedingChapters,
    wordCountTarget,
    toneAdjustment,
    activePreset,
    customInst,
    projectRules,
    mimicStyleText,
  } = params;

  const beatsStr = chapter.beats?.length
    ? chapter.beats.map((b, i) => `${i + 1}. [Tension: ${b.tension}] ${b.description}`).join("\n")
    : "1. Protagonist navigates immediate challenge through tactics.";

  const charsStr = characters.length
    ? characters.map(c => `- ${c.name}: ${c.appearance}. Personality: ${c.personality}. Goal: ${c.arcGoal}`).join("\n")
    : "- No active side characters in context.";

  const locationStr = location
    ? `${location.name} — ${location.atmosphere}. ${location.description}`
    : "High-intensity environment with ambient danger.";

  const historyStr = precedingChapters.length
    ? precedingChapters.map(c => `Chapter ${c.chapterNumber} History: [${c.summary || "Ryan Vance survives and advances."}]`).join("\n")
    : "No previous chapters indexed yet (Awakening / Volume start context).";

  const customRulesStr = projectRules.length
    ? `\nSTRICT CUSTOM DIRECTIVES FROM CLIENT (MANDATORY ENFORCEMENT):\n` + projectRules.map((v, i) => `- [CRITICAL RULE ${i + 1}] ${v}`).join("\n")
    : "";

  const mimicStr = mimicStyleText.trim()
    ? `\n\n[CRITICAL DIRECTIVE: MIMIC USER-PROVIDED ORIGINAL WRITING STYLE]
You MUST mimic the exact vocabulary density, sentence complexity, paragraph-split rhythm, Indonesian/English language slang blend, and character voicing patterns of the author's reference text below. Do NOT just copy general tone; mimic how the prose is physically constructed, the word usage, and style of writing:
"""
${mimicStyleText.trim()}
"""`
    : "";

  return `CORE WRITING TASK: Draft Chapter ${chapter.chapterNumber} of the manuscript.
Chapter Title Goal: "${chapter.title}"
Target Chapter Length: Around ${wordCountTarget} words.
Current Focus POV: ${chapter.pov}

[CRITICAL PROSE STYLE BASE RULES]
${BASE_PROSE_RULES}

PREPARED OUTLINE BEATS:
${beatsStr}

DUNGEON LOCATION SETTING:
${locationStr}

ACTIVE CAST MEMBERS IN PLAY:
${charsStr}

PRECEDING CHAPTER HISTORY SUMMARY:
${historyStr}

ADDITIONAL WRITER SPECIFIC MEMO DIR:
${customInst || "Write this sequence with focused visual logic and dry tactical dialogue."}
${customRulesStr}
${mimicStr}

Write out the raw chapter text in solid HTML paragraph format (using standard <p> tags for line separation) aligning precisely with the pacing of each plot beat. Do NOT introduce any conversational notes, explanations, or labels before or after the HTML text.`;
}

// ─────────────────────────────────────────────
// BASIC INSTR_RULES GENERATION FOR CH_STREAM
// ─────────────────────────────────────────────
export function buildChapterSystemInstruction(
  chapterNumber: number,
  toneAdjustment: string,
  projectRules: string[],
  mimicStyleText: string
): string {
  const customProjectRulesStr = projectRules.length > 0
    ? `\n\nSTRICT DIRECT CUSTOM DIRECTIVES FROM CLIENT (MANDATORY ENFORCEMENT):\n` + projectRules.map((v, i) => `- [CRITICAL RULE ${i + 1}] ${v}`).join("\n")
    : "";

  const mimicStyleInstruction = mimicStyleText.trim()
    ? `\n\n[CRITICAL DIRECTIVE: MIMIC USER-PROVIDED ORIGINAL WRITING STYLE]
You MUST mimic the exact vocabulary density, sentence complexity, paragraph-split rhythm, Indonesian/English language slang blend, and character voicing patterns of the author's reference text below. Do NOT just copy general tone; mimic how the prose is physically constructed, the word usage, and style of writing:
"""
${mimicStyleText.trim()}
"""`
    : "";

  return `You are an elite webnovel writer. Write the FULL, detailed narrative of Chapter ${chapterNumber}.
CRITICAL: Do NOT summarize, outline, or skip scenes. Write actual, raw, fully immersive, fluid narrative prose representing the target length.

[CRITICAL PROSE STYLE BASE RULES — APPLY THESE STYLISTIC CONTROLS STRONGLY]
${BASE_PROSE_RULES}

PROSE STYLE DIRECTIVE:
- Maintain a natural, flowing narrative pacing ("mengalir lancar") with seamless scene transitions and authentic character dynamics.
- Absolutely NO poetic or cinematic metaphors, no landscape descriptions, or atmospheric flowery writing.
- Style Must Flow: Avoid excessive fragmented sentence splits or robotic staccato. Ensure gestures are described with smooth, integrated syntax.
- Focus on concrete actions, realistic character motions, and vivid sensory grounding.
- Tone Preset: Write in a [${toneAdjustment}] style.

COMPLY WITH THE PRECISE WRITING GUARD CONFIGURATIONS:
You MUST strictly enforce and incorporate every single custom writing guard rule defined below. Do NOT ignore any of these guidelines:${customProjectRulesStr}

FORMATTING REQUIREMENT:
- Return ONLY the continuous sequence of story paragraphs wrapped in <p> tags.
- Absolutely NO conversational introductions, notes, comments, warnings, or outlines before or after the narrative.${mimicStyleInstruction}`;
}

// ─────────────────────────────────────────────
// ANTI-SLOP ANALYSIS PROMPT
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// ANTI-SLOP ANALYSIS PROMPT
// ─────────────────────────────────────────────
export function buildSlopAnalysisPrompt(chapterContent: string, synopsis: string): string {
  return `You are an expert webnovel editor specialized in detecting AI-generated writing patterns ("AI slop") in fiction.

Analyze the chapter draft below and return a single valid JSON object matching this exact structure. No preamble, no markdown fences, no explanation outside the JSON.

SCORING CONVENTION:
- All scores range 0–100.
- Higher score = WORSE (more slop, more AI-like).
- overallScore: weighted average of all subscores. 0 = perfectly human prose. 100 = maximum AI slop.

SUBSCORES:
- purpleProse: Poetic/cinematic/over-decorated language, fancy metaphors, ambient scene-setting as opening.
- negationPatterns: Use of "did not", "was not merely", "bukan sekadar X melainkan Y" patterns instead of direct positive statements.
- dialogueFormulaic: Repetitive "[action]. [dialogue]" or "[dialogue]," kata X sambil [action]." patterns on consecutive lines.
- adverbDensity: Overuse of adverbs, especially emotional adverbs ("softly", "quietly", "heavily").
- clicheIntensity: Banned intensity words — "palpable", "piercing", "ethereal", "heart hammered", "eyes widened", "heavy silence", "shiver ran down".
- propOverdescription: Decorating minor background objects with adjectives ("rusted hydraulics", "weathered metal", "decaying fence").
- pacingIssues: Dense paragraphs (4+ sentences), uniform paragraph lengths with no rhythm variation, slow scene entry, or severe sentence fragmentation/robotic staccato (where continuous gestures or posture changes that should flow as one sentence are chopped into individual mini-sentences).

RETURN THIS EXACT JSON STRUCTURE:
{
  "overallScore": number,
  "summary": "One paragraph. What's the biggest problem in this chapter and the most urgent fix.",
  "scores": {
    "purpleProse": number,
    "negationPatterns": number,
    "dialogueFormulaic": number,
    "adverbDensity": number,
    "clicheIntensity": number,
    "propOverdescription": number,
    "pacingIssues": number
  },
  "issues": [
    {
      "id": "unique_id",
      "category": "PurpleProse" | "NegationPattern" | "DialogueFormulaic" | "Adverb" | "ClicheIntensity" | "PropOverdescription" | "Pacing",
      "severity": "High" | "Medium" | "Low",
      "originalText": "exact flagged passage from the chapter",
      "startIndex": number or null,
      "explanation": "specific reason this is flagged, referencing the exact rule violated",
      "suggestions": ["concrete rewrite option 1", "concrete rewrite option 2"]
    }
  ]
}

ANALYSIS RULES:
- Flag ONLY actual violations. Do not flag clean prose.
- originalText must be copied verbatim from the chapter. Never paraphrase it.
- Each suggestion must be a drop-in replacement, same narrative beat, zero slop.
- If synopsis is provided, use it only to understand character/plot context. Do not flag stylistic choices that are intentional given the story context.
- Prioritize High severity issues. Cap total issues at 20. If more exist, surface the worst ones.

PROJECT SYNOPSIS (for context only):
${synopsis || "No synopsis provided."}

CHAPTER TO ANALYZE:
${chapterContent}

Return ONLY valid JSON. No preamble.`;
}

// ─────────────────────────────────────────────
// VOCAB SIMPLICITY PROMPT
// ─────────────────────────────────────────────
export function buildVocabAnalysisPrompt(chapterContent: string): string {
  return `You are a readability editor for webnovels. Identify pretentious, overly formal, or "kaku" words.

Return JSON:
{
  "issues": [
    {
      "id": "unique_id",
      "word": "the problematic word",
      "originalText": "sentence containing the word",
      "explanation": "why it feels stiff/formal",
      "suggestions": ["simpler alternative 1", "simpler alternative 2"],
      "status": "pending"
    }
  ]
}

Target: casual, grounded webnovel prose. Replace clinical/theatrical/academic words with direct everyday language.

CONTENT:
${chapterContent}

Return ONLY valid JSON. No preamble.`;
}

// ─────────────────────────────────────────────
// PASSAGE POLISH PROMPT
// ─────────────────────────────────────────────
export function buildPolishPassagePrompt(
  selectedText: string,
  polishQuery: string,
  synopsis: string
): string {
  return `You are a webnovel prose editor. Rewrite ONLY the passage below based on the instruction.

INSTRUCTION: ${polishQuery}

ORIGINAL PASSAGE:
"${selectedText}"

NOVEL CONTEXT:
${synopsis || "No context provided."}

[CRITICAL PROSE STYLE BASE RULES]
${BASE_PROSE_RULES}

Rules:
- Keep the same narrative meaning and character actions.
- Style must be completely natural, flowing, easy to understand.
- Absolutely NO poetic or cinematic metaphors, no landscape descriptions, or atmospheric flowery writing.
- Avoid robotic fragmented sentence splits or repetitive staccato. Make continuous gestures and postures flow smoothly.
- Apply anti-slop rules: no adverb stacking, no purple prose.
- Match webnovel pacing: direct, kinetic, clear.
- Output ONLY the rewritten passage. No labels, no explanation.`;
}
