// src/config/ai-prompts.ts

import { Chapter, Character, Location } from "../types";

// ─────────────────────────────────────────────
// SYSTEM: Base prose rules yang selalu dipakai
// ─────────────────────────────────────────────
export const BASE_PROSE_RULES = `
════════════════════════════════════════════════════════
WEBNOVEL PROSE DIRECTIVES — PRIORITY-TIERED
════════════════════════════════════════════════════════
Priority tiers:
  [P0] = ABSOLUTE. Violating this breaks the chapter. Zero tolerance.
  [P1] = CRITICAL. Strongly enforced every paragraph.
  [P2] = STANDARD. Apply consistently throughout.

────────────────────────────────────────────────────────
[P0-A] BANNED PATTERNS — NEVER WRITE THESE
────────────────────────────────────────────────────────
These are the clearest signal that prose is AI-generated. Any instance = immediate failure.

▸ NEGATION FRAMING (redefining X by saying what it is NOT):
  ❌ "That wasn't just a bet. It was a guarantee."
  ❌ "It wasn't merely fear. It was something deeper."
  ❌ "The payments weren't missing. They were being diverted."
  ❌ "Bukan sekadar ancaman. Itu perintah."
  ✅ Write the actual thing directly: "It was a guarantee." / "Someone was diverting the payments." / "Itu perintah."

▸ CINEMATIC/POETIC SCENE OPENERS:
  ❌ "The rain fell in silver sheets across the broken skyline..."
  ❌ "Silence hung over the room like a funeral shroud."
  ❌ "Cahaya rembulan menyapu lantai beton yang dingin..."
  ✅ Open with action, dialogue, or immediate reaction. Weave setting in later.

▸ BANNED INTENSITY WORDS (always sound theatrical, never earned):
  palpable / piercing / ethereal / visceral / electrifying / haunting / suffocating
  "heavy silence" / "oppressive air" / "shiver ran down his spine"
  "heart hammered" / "eyes widened" / "breath caught in his throat"
  Use these ONLY if the scene genuinely earns extreme physical shock — and only once per chapter maximum.

▸ BANNED WORD: "ozone" — never use this word in any context.

▸ SMELLS — ABSOLUTE BAN:
  Never describe smells, odors, scents, fragrance, or olfactory atmosphere. Not once.

────────────────────────────────────────────────────────
[P0-B] SENTENCE FLOW — NO ROBOTIC STACCATO
────────────────────────────────────────────────────────
Continuous actions and related gestures MUST flow as one sentence. Do not chop them into robotic mini-sentences.

  ❌ "He stood up. He brushed dust off his knees. He looked up."
  ❌ "She exhaled. She reached for the door. She stopped."
  ✅ "He stood, brushed dust off his knees, and looked up."
  ✅ "She exhaled, reached for the door, then stopped."

This is the single biggest reason prose sounds robotic. Enforce this every paragraph.

────────────────────────────────────────────────────────
[P1-A] DIALOGUE — NATURAL DENSITY & VOICE
────────────────────────────────────────────────────────
Target: 30–50% of chapter content must be direct spoken dialogue.

▸ ALWAYS use standard double quotation marks ("...") for all speech. Never omit them.

▸ Use spoken particles and contractions to make characters sound human:
  English: don't, can't, I'm, yeah, gonna, nah, look
  Indonesian: sih, kok, kan, dong, lho, ya, aja, deh, tuh, nggak, gimana

▸ Vary dialogue attribution. Do NOT use the same formula every turn:
  ❌ (Repeated) "Action. 'Dialogue.'" / "'Dialogue,' kata X sambil Action."
  ✅ Mix: tagless back-and-forth / action before speech / speech then action / internal thought bridging dialogue

▸ BAD (formulaic, robotic):
  He crossed his arms. "You don't know what you're talking about."
  She looked away. "Maybe I do."
  He stepped forward. "Then prove it."

▸ GOOD (varied, natural):
  He crossed his arms. "You don't know what you're talking about."
  "Maybe I do."
  "Then prove it." He stepped forward, close enough that she had to tilt her head back to meet his eyes.

▸ Solo character scenes: let them mutter aloud, recall verbal exchanges, or replay past conversations in internal monologue to maintain dialogue presence.

────────────────────────────────────────────────────────
[P1-B] PROP & SETTING DESCRIPTION — MINIMAL ADJECTIVES
────────────────────────────────────────────────────────
Minor background objects get ZERO decorative adjectives. Only named, plot-relevant items earn descriptors.

  ❌ "the rusted hydraulic door" / "weathered concrete walls" / "a narrow service hatch" / "a fine layer of grit"
  ✅ "the door" / "concrete walls" / "the hatch" / "grit on the floor"

Use only 1–2 concrete visual details to establish a scene. Then move on.

────────────────────────────────────────────────────────
[P1-C] PACING — SHORT PARAGRAPHS, VARIABLE RHYTHM
────────────────────────────────────────────────────────
▸ Micro-paragraphs: 1–3 sentences max per paragraph for mobile readability.
▸ Vary paragraph length deliberately: a 1-sentence beat after a 3-sentence build creates rhythm.
▸ No paragraph should exceed 4 sentences. If it does, split it.
▸ Do NOT fast-forward or skip beats. Flesh out every beat in the outline fully.

────────────────────────────────────────────────────────
[P1-D] HIT TARGET LENGTH WITHOUT FILLER
────────────────────────────────────────────────────────
To reach word count targets WITHOUT resorting to scenery decoration or purple prose:

1. EXPAND DIALOGUE — Write longer conversation threads. Characters debate tactics, voice doubts, argue options.
2. DEEPEN INTERNAL MONOLOGUE — Let the POV character analyze surroundings, plan next moves, reflect on constraints.
3. PACE THE ACTION — Break tense sequences into sequential beats with internal reactions between physical moves.

Never pad with ambient description, weather, or atmosphere to hit word count.

────────────────────────────────────────────────────────
[P2-A] VOCABULARY — SIMPLE, DIRECT, MODERN
────────────────────────────────────────────────────────
▸ Prefer the simpler word. "red" over "crimson" unless crimson is specifically right. "dark" over "shadow-drenched."
▸ No stacked adjectives on a single noun: "the old, rusted, creaking metal door" → "the metal door."
▸ No adverb stacking: "she said softly and quietly" → "she said quietly."
▸ Avoid academic/theatrical vocabulary. Write like a person who reads a lot, not like someone performing literature.

────────────────────────────────────────────────────────
[P2-B] SCENE ENTRY — ORGANIC & IN-MOTION
────────────────────────────────────────────────────────
▸ Start chapters/scenes mid-action, mid-dialogue, or on a character's immediate reaction.
▸ NEVER open with weather, landscape panning, or atmospheric throat-clearing.
▸ If setting context is needed, insert it naturally after the first action beat.

════════════════════════════════════════════════════════
PRE-WRITE MENTAL CHECKLIST (run before generating each paragraph):
  [ ] Does this paragraph start mid-action or mid-thought? (Not with weather/atmosphere)
  [ ] Are continuous gestures combined into one flowing sentence?
  [ ] No negation framing? ("wasn't just X" etc.)
  [ ] No banned intensity words?
  [ ] No smell descriptions?
  [ ] Minor props described without adjectives?
  [ ] Dialogue uses natural particles/contractions?
  [ ] Paragraph is 1–3 sentences max?
════════════════════════════════════════════════════════`;

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
    ? precedingChapters.map(c => `Chapter ${c.chapterNumber}: [${c.summary || "Protagonist survives and advances."}]`).join("\n")
    : "No previous chapters indexed yet (Volume start context).";

  const customRulesStr = projectRules.length
    ? `\n\n────────────────────────────────────────────────────────\nCUSTOM DIRECTIVES — [P0] MANDATORY, NO EXCEPTIONS\n────────────────────────────────────────────────────────\n` +
    projectRules.map((v, i) => `[CUSTOM-${i + 1}] ${v}`).join("\n")
    : "";

  const mimicStr = mimicStyleText.trim()
    ? `\n\n════════════════════════════════════════════════════════
STYLE MIMIC DIRECTIVE — [P0] HIGHEST PRIORITY
════════════════════════════════════════════════════════
Mimic the EXACT prose construction of this reference text. Not just tone — the physical sentence rhythm, paragraph split pattern, vocabulary density, Indonesian/English blend, and character voice cadence.

Study how sentences are built. Study where paragraphs break. Study which words the author chooses versus avoids. Then write the chapter as if this author wrote it.

REFERENCE TEXT:
"""
${mimicStyleText.trim()}
"""`
    : "";

  return `TASK: Write Chapter ${chapter.chapterNumber} of the manuscript.
Title Goal: "${chapter.title}"
Target Length: ~${wordCountTarget} words
POV: ${chapter.pov}
Tone Preset: [${toneAdjustment}]

════════════════════════════════════════════════════════
PROSE DIRECTIVES — READ FULLY BEFORE WRITING
════════════════════════════════════════════════════════
${BASE_PROSE_RULES}
${customRulesStr}
${mimicStr}

════════════════════════════════════════════════════════
CHAPTER CONTEXT
════════════════════════════════════════════════════════
PLOT BEATS (write every beat fully — no skipping):
${beatsStr}

LOCATION:
${locationStr}

ACTIVE CHARACTERS:
${charsStr}

CHAPTER HISTORY:
${historyStr}

WRITER MEMO:
${customInst || "Write with focused visual logic and dry tactical dialogue."}

════════════════════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════════════════════
Return ONLY raw chapter prose wrapped in <p> tags.
Zero preamble. Zero post-chapter notes. Zero labels. Just the story.`;
}

// ─────────────────────────────────────────────
// SYSTEM INSTRUCTION FOR CHAPTER STREAM
// ─────────────────────────────────────────────
export function buildChapterSystemInstruction(
  chapterNumber: number,
  toneAdjustment: string,
  projectRules: string[],
  mimicStyleText: string
): string {
  const customProjectRulesStr = projectRules.length > 0
    ? `\n\n────────────────────────────────────────────────────────\nCUSTOM DIRECTIVES — [P0] MANDATORY\n────────────────────────────────────────────────────────\n` +
    projectRules.map((v, i) => `[CUSTOM-${i + 1}] ${v}`).join("\n")
    : "";

  const mimicStyleInstruction = mimicStyleText.trim()
    ? `\n\n════════════════════════════════════════════════════════
STYLE MIMIC DIRECTIVE — [P0] HIGHEST PRIORITY
════════════════════════════════════════════════════════
Mimic the EXACT prose construction of this reference text. Not just tone — the physical sentence rhythm, paragraph split pattern, vocabulary density, Indonesian/English blend, and character voice cadence.

REFERENCE TEXT:
"""
${mimicStyleText.trim()}
"""`
    : "";

  return `You are an elite webnovel writer. Your task: write the FULL, detailed narrative of Chapter ${chapterNumber}.

CRITICAL OUTPUT RULE: Do NOT summarize, outline, or skip scenes. Write actual, fully immersive narrative prose at target length. Every beat in the outline must be fully written out.

════════════════════════════════════════════════════════
PROSE DIRECTIVES — [P0] RULES ARE NON-NEGOTIABLE
════════════════════════════════════════════════════════
${BASE_PROSE_RULES}
${customProjectRulesStr}
${mimicStyleInstruction}

TONE PRESET: [${toneAdjustment}]

════════════════════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════════════════════
Return ONLY the chapter prose in continuous <p> tags.
Absolutely NO conversational introductions, author notes, outlines, warnings, or meta-commentary before or after the narrative.`;
}

// ─────────────────────────────────────────────
// ANTI-SLOP ANALYSIS PROMPT
// ─────────────────────────────────────────────
export function buildSlopAnalysisPrompt(chapterContent: string, synopsis: string): string {
  return `You are an expert webnovel editor specialized in detecting AI-generated writing patterns ("AI slop") in fiction.

Analyze the chapter draft below and return a single valid JSON object matching the exact structure specified. No preamble, no markdown fences, no explanation outside the JSON.

════════════════════════════════════════════════════════
SCORING CONVENTION
════════════════════════════════════════════════════════
All scores range 0–100. Higher = WORSE (more AI-like slop).
overallScore: weighted average of all subscores. 0 = clean human prose. 100 = pure AI slop.

════════════════════════════════════════════════════════
SUBSCORES — WHAT EACH MEASURES
════════════════════════════════════════════════════════
purpleProse:
  Poetic/cinematic/over-decorated language. Fancy metaphors. Ambient scene-setting as chapter opener.
  Flag: weather openers, landscape panning, "silence hung like X", "light fell like Y"

negationPatterns:
  "Not just X, but Y" / "wasn't merely X" / "bukan sekadar X melainkan Y" constructions.
  Flag: any sentence that defines something by first saying what it is NOT.

dialogueFormulaic:
  Repetitive attribution patterns used on consecutive lines.
  Flag: "[action]. '[dialogue]'" or "'[dialogue],' kata X sambil [action]" appearing 3+ times in sequence without variation.

adverbDensity:
  Overuse of adverbs, especially emotional/manner adverbs.
  Flag: softly, quietly, heavily, gently, slowly used more than once per 200 words; adverb stacking.

clicheIntensity:
  Banned intensity words used as lazy emphasis.
  Flag: palpable, piercing, ethereal, visceral, "heart hammered", "eyes widened", "breath caught", "shiver ran down", "heavy silence".

propOverdescription:
  Decorating minor background objects with adjectives.
  Flag: "rusted hydraulics", "weathered metal", "crumbling concrete", "narrow hatch", "dim corridor" applied to background props with no plot relevance.

pacingIssues:
  Covers TWO failure modes — (A) dense walls of text OR (B) robotic staccato.
  Flag A: paragraphs 4+ sentences, uniform length with no rhythm variation, slow scene entry.
  Flag B: continuous gestures/actions chopped into separate single-sentence mini-paragraphs ("He stood up. He brushed his knees. He looked up.")

════════════════════════════════════════════════════════
RETURN THIS EXACT JSON STRUCTURE
════════════════════════════════════════════════════════
{
  "overallScore": number,
  "summary": "One paragraph. The biggest problem in this chapter and the single most urgent fix.",
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
      "originalText": "exact flagged passage copied verbatim from the chapter",
      "startIndex": number or null,
      "explanation": "specific reason this is flagged, naming the exact rule violated",
      "suggestions": ["concrete rewrite option 1", "concrete rewrite option 2"]
    }
  ]
}

════════════════════════════════════════════════════════
ANALYSIS RULES
════════════════════════════════════════════════════════
- Flag ONLY actual violations. Do not flag clean prose.
- originalText must be copied verbatim. Never paraphrase the flagged passage.
- Each suggestion must be a drop-in replacement: same narrative beat, zero slop.
- If synopsis is provided, use it for character/plot context only. Do not flag intentional stylistic choices given story context.
- Prioritize High severity. Cap total issues at 20. If more exist, surface the worst ones.

════════════════════════════════════════════════════════
PROJECT SYNOPSIS (context only — do not analyze this):
${synopsis || "No synopsis provided."}

CHAPTER TO ANALYZE:
${chapterContent}

Return ONLY valid JSON. No preamble.`;
}

// ─────────────────────────────────────────────
// VOCAB SIMPLICITY PROMPT
// ─────────────────────────────────────────────
export function buildVocabAnalysisPrompt(chapterContent: string): string {
  return `You are a readability editor for webnovels targeting mobile readers. Identify words that feel pretentious, overly formal, theatrical, or "kaku" — out of place for casual grounded prose.

Return JSON only. No preamble.

{
  "issues": [
    {
      "id": "unique_id",
      "word": "the problematic word",
      "originalText": "the full sentence containing the word",
      "explanation": "why it feels stiff, formal, or theatrical in this context",
      "suggestions": ["simpler alternative 1", "simpler alternative 2"],
      "status": "pending"
    }
  ]
}

TARGET REGISTER: Casual, grounded, everyday language. Replace clinical/theatrical/academic vocabulary with words a sharp person would use in natural conversation.

Do NOT flag words that are genuinely the best choice for the context. Only flag when a simpler word would serve equally well or better.

CONTENT TO ANALYZE:
${chapterContent}

Return ONLY valid JSON.`;
}

// ─────────────────────────────────────────────
// PASSAGE POLISH PROMPT
// ─────────────────────────────────────────────
export function buildPolishPassagePrompt(
  selectedText: string,
  polishQuery: string,
  synopsis: string
): string {
  return `You are a webnovel prose editor. Rewrite ONLY the passage below based on the instruction given.

INSTRUCTION: ${polishQuery}

ORIGINAL PASSAGE:
"${selectedText}"

NOVEL CONTEXT:
${synopsis || "No context provided."}

════════════════════════════════════════════════════════
REWRITE RULES
════════════════════════════════════════════════════════
[P0] No negation framing ("wasn't just X", "bukan sekadar X melainkan Y")
[P0] No robotic staccato — combine continuous actions into flowing sentences
[P0] No smell descriptions. No banned intensity words (palpable, piercing, ethereal, etc.)
[P0] No cinematic/poetic openers

[P1] Keep the same narrative meaning and character actions
[P1] No adjective stacking on minor props
[P1] Dialogue uses natural particles and contractions
[P1] Paragraphs 1–3 sentences max

[P2] Simple, direct vocabulary — prefer the shorter word
[P2] No adverb stacking
[P2] Natural, effortless reading flow

OUTPUT: Return ONLY the rewritten passage. No labels. No explanation. No preamble.`;
}