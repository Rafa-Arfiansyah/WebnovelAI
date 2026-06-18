// src/config/ai-prompts.ts

import { Chapter, Character, Location } from "../types";
import {
  getCinematicVocabString,
  getBannedIntensityString,
  getStockImpactString,
  getEnergyWordClusterString,
  getScoringPenaltyBlock,
  ENERGY_WORD_MAX_PER_CHAPTER,
  SUGGESTION_QUALITY_RULES,
  STRUCTURAL_PATTERN_RULES,
  ABSOLUTE_BANNED_WORDS,
} from "./ai-slop-database";

// ─────────────────────────────────────────────
// GEMINI HARD STOP BLOCK
// Posisi PERTAMA di setiap system prompt.
// Pendek, eksplisit, tidak bisa diabaikan.
// ─────────────────────────────────────────────
export const GEMINI_HARD_STOPS = `
╔══════════════════════════════════════════════════════╗
║  HARD STOP — THESE RULES OVERRIDE EVERYTHING ELSE  ║
║  Violating ANY of these = output is invalid.        ║
╚══════════════════════════════════════════════════════╝

[STOP-1] NEVER open a chapter or scene with weather, atmosphere, landscape, or mood-setting.
  ❌ "Rain swept across the city..."
  ❌ "Silence blanketed the room..."
  ❌ "Cahaya redup menyapu lantai beton..."
  ✅ Start with action, dialogue, or a character's immediate reaction. Always.

[STOP-2] NEVER use negation framing.
  ❌ "That wasn't just fear. It was something deeper."
  ❌ "Bukan sekadar ancaman. Itu perintah."
  ❌ "It wasn't a request. It was a command."
  ✅ Write the actual thing directly. Skip the "not X" setup entirely.

[STOP-3] NEVER chop continuous actions into staccato sentences, and NEVER leave dangling verbs or fragments.
  ❌ "He stood up. He dusted his knees. He looked at her."
  ❌ "He landed a blow into the Stalker's chest. slid." (dangling verb)
  ❌ "Ryan watched the meter climb. draining" (fragmented participle)
  ✅ "He stood, dusted his knees, and looked at her."
  ✅ "He landed a blow into the Stalker's chest, sliding back as it staggered."
  Rule: Every sentence must have a complete subject and predicate.

[STOP-4] NEVER use these banned words (hard ban, no exceptions):
  Banned Intensity: ${getBannedIntensityString()}
  Banned Cinematic: ${getCinematicVocabString()}
  Absolute Banned: ${ABSOLUTE_BANNED_WORDS.map(w => `"${w}"`).join(", ")}

[STOP-5] NEVER describe smells, scents, fragrance, or odors. Not once.

[STOP-6] NEVER add adjectives to background props. Minor objects = zero adjectives.
  ❌ "the rusted hydraulic door" / "weathered concrete walls" / "dim flickering corridor"
  ✅ "the door" / "concrete walls" / "the corridor"

[STOP-7] NEVER pad with filler. Every sentence must advance plot, character, or tension.
  ❌ Extended atmospheric paragraphs with no narrative function
  ❌ Restating what the character already knows
  ❌ Over-explaining emotions the action already shows

[STOP-8] NEVER use stock impact phrases:
  ${getStockImpactString()}
  Replace with specific body-part sensations and physical gear reactions.

[STOP-9] NEVER describe a setting element unless the character physically interacts with it OR it creates immediate danger.
  If it can be deleted without changing the scene → delete it.
  ❌ "metal flooring" / "littered corridor" / "concrete walls"
  ✅ Only describe what the character touches, trips on, hides behind, or gets hit by.

[STOP-10] NEVER write a clean win. Every victory must have a visible cost or an immediate new problem.
  ❌ "I walked into the dark, ready for whatever came next."
  ✅ Protagonist limping, gear damaged, resource depleted, or new threat already emerging.
`;

// ─────────────────────────────────────────────
// BASE PROSE RULES
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
▸ NEGATION FRAMING:
  ❌ "That wasn't just a bet. It was a guarantee."
  ❌ "Bukan sekadar ancaman. Itu perintah."
  ✅ Write the actual thing directly.

▸ CINEMATIC/POETIC SCENE OPENERS:
  ❌ "The rain fell in silver sheets across the broken skyline..."
  ❌ "Silence hung over the room like a funeral shroud."
  ✅ Open with action, dialogue, or immediate reaction.

▸ BANNED INTENSITY WORDS: ${getBannedIntensityString()}
▸ BANNED CINEMATIC VOCAB: ${getCinematicVocabString()}
▸ SMELLS — ABSOLUTE BAN. Never describe smells, odors, scents, fragrance.

────────────────────────────────────────────────────────
[P0-B] SENTENCE FLOW — NO STACCATO, NO FRAGMENTS
────────────────────────────────────────────────────────
  ❌ "He stood up. He brushed dust. He looked up."
  ✅ "He stood, brushed dust off his knees, and looked up."
  Every sentence must be a complete grammatical clause.

────────────────────────────────────────────────────────
[P1-A] DIALOGUE — 30–50% OF CHAPTER CONTENT
────────────────────────────────────────────────────────
▸ Always use double quotation marks ("...").
▸ Contractions & particles: don't, can't, yeah, gonna / sih, kok, kan, nggak, aja, deh
▸ Vary attribution every exchange — never repeat the same formula:
  ❌ He crossed his arms. "Wrong." / She looked away. "Maybe." / He stepped forward. "Prove it."
  ✅ Mix tagless back-and-forth, action before speech, speech then action, internal thought bridges.
▸ Solo scenes: character mutters aloud or replays past conversations.

────────────────────────────────────────────────────────
[P1-B] PROPS — MINIMAL ADJECTIVES
────────────────────────────────────────────────────────
Minor background objects = zero adjectives. Only plot-relevant items earn descriptors.
  ❌ "rusted hydraulic door" / "weathered concrete" / "narrow hatch"
  ✅ "the door" / "concrete" / "the hatch"
Use 1–2 concrete visual details per scene. Then move on.

────────────────────────────────────────────────────────
[P1-C] PACING — SHORT PARAGRAPHS, VARIABLE RHYTHM
────────────────────────────────────────────────────────
▸ Max 3 sentences per paragraph. Hard limit 4. Split anything longer.
▸ Vary length deliberately: 1-sentence beat after 3-sentence build = rhythm.
▸ Never skip or summarize beats. Write every beat fully.

────────────────────────────────────────────────────────
[P1-D] HIT WORD COUNT WITHOUT PADDING
────────────────────────────────────────────────────────
1. EXPAND DIALOGUE — longer exchanges, characters debate, argue, reveal doubts
2. DEEPEN INTERNAL MONOLOGUE — POV character analyzes, plans, reacts
3. PACE ACTION — break tense sequences into beats with internal reactions between moves
Never pad with scenery, weather, or atmosphere.

────────────────────────────────────────────────────────
[P1-E] FIGHT/ACTION PACING — PENDEK DAN SNAPPY
────────────────────────────────────────────────────────
  Setup/tension    → boleh panjang
  Fight/action     → singkat, langsung ke dampak
  Aftermath/reaksi → boleh panjang

▸ Satu exchange = maks 2 kalimat. Tulis DAMPAK, bukan proses.
▸ Kena pukul = tulis yang dirasain, bukan kronologi.
▸ Internal monologue di tengah fight = maks 1 kalimat per beat.

  ❌ "Ia melangkah ke kanan, menghindari tebasan. Kakinya menapak. Ia memutar badan."
  ✅ "Dua tebasan dia dodge, yang ketiga diblok — lengannya mati rasa sampai siku."
  ❌ "He calculated the angle, shifted weight, drove his elbow upward into the jaw."
  ✅ "He drove his elbow up. Bone met bone. The guy dropped."

────────────────────────────────────────────────────────
[P1-F] HOOKS & CLIFFHANGERS
────────────────────────────────────────────────────────
▸ HOOK: Kalimat pertama = aksi, dialog, atau reaksi langsung. Bukan warmup atau atmosfer.
▸ CLIFFHANGER: Paragraf terakhir harus tajam — ancaman mendekat, pertanyaan tak terjawab,
  atau keputusan darurat di tengah ketegangan. Reader harus merasa harus buka chapter berikutnya.

────────────────────────────────────────────────────────
[P1-G] ENERGY/POWER WORD ROTATION
────────────────────────────────────────────────────────
▸ Words (${getEnergyWordClusterString()}) — max ${ENERGY_WORD_MAX_PER_CHAPTER}x each per ~1500 words.
  After the ${ENERGY_WORD_MAX_PER_CHAPTER}rd use, switch to a different word.

────────────────────────────────────────────────────────
[P1-H] NO CLEAN WINS
────────────────────────────────────────────────────────
▸ Every victory or power activation MUST have a visible cost or immediate new problem.
▸ Protagonist can win, but cannot leave the scene in the same condition they entered.
  ❌ Power activates → works perfectly → walks away composed
  ✅ Power activates → something goes wrong OR costs something → barely gets out

────────────────────────────────────────────────────────
[P2-A] VOCABULARY — SIMPLE, DIRECT, MODERN
────────────────────────────────────────────────────────
▸ Prefer simpler word. "red" over "crimson." "dark" over "shadow-drenched."
▸ No stacked adjectives: "old rusted creaking door" → "the door."
▸ No adverb stacking: "said softly and quietly" → "said quietly."
▸ Write like a person who reads a lot, not like someone performing literature.

────────────────────────────────────────────────────────
[P2-B] SCENE ENTRY — ORGANIC & IN-MOTION
────────────────────────────────────────────────────────
▸ Start mid-action, mid-dialogue, or on immediate reaction.
▸ NEVER open with weather, landscape, or atmospheric throat-clearing.
▸ Insert setting context naturally after the first action beat.

════════════════════════════════════════════════════════
PRE-WRITE CHECKLIST (run before every paragraph):
  [ ] Opening = action or dialogue? (not weather/atmosphere)
  [ ] Continuous actions merged into one sentence?
  [ ] No negation framing?
  [ ] No banned intensity/cinematic words?
  [ ] No smell descriptions?
  [ ] Background props have zero adjectives?
  [ ] Dialogue has contractions/particles?
  [ ] Paragraph ≤3 sentences?
  [ ] Energy words used <${ENERGY_WORD_MAX_PER_CHAPTER}x?
  [ ] Protagonist has a moment of imperfection or miscalculation?
  [ ] No stock impact phrases?
  [ ] No clean win — is there a cost or new problem?
════════════════════════════════════════════════════════`;

// ─────────────────────────────────────────────
// CHAPTER GENERATION PROMPT
// FIX: GEMINI_HARD_STOPS now included at top of prompt.
// ─────────────────────────────────────────────
interface ChapterPromptParams {
  chapter: Chapter;
  characters: Character[];
  location: Location | undefined;
  precedingChapters: Chapter[];
  wordCountTarget: number;
  toneAdjustment: string;
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
Mimic the EXACT prose construction of this reference text.
Not just tone — sentence rhythm, paragraph split pattern, vocabulary density, Indonesian/English blend, character voice cadence.
Study how sentences are built. Study where paragraphs break. Write as if this author wrote it.

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
STEP 1 — READ THESE RULES BEFORE WRITING ANYTHING
════════════════════════════════════════════════════════
${GEMINI_HARD_STOPS}

${BASE_PROSE_RULES}
${customRulesStr}
${mimicStr}

════════════════════════════════════════════════════════
STEP 2 — CHAPTER CONTEXT
════════════════════════════════════════════════════════
PLOT BEATS (write every beat fully — no skipping, no summarizing):
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
STEP 3 — SELF-CHECK BEFORE FIRST WORD
════════════════════════════════════════════════════════
Confirm before writing:
  ✓ First sentence = action or dialogue (NOT weather/atmosphere)
  ✓ No "wasn't just X / bukan sekadar X" anywhere
  ✓ Staccato chains merged into flowing sentences
  ✓ Zero banned intensity/cinematic words
  ✓ Zero smell descriptions
  ✓ Background props: no adjectives
  ✓ Every climax beat has a cost or new problem

════════════════════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════════════════════
Return ONLY raw chapter prose wrapped in <p> tags.
Zero preamble. Zero post-chapter notes. Zero labels. Just the story.`;
}

// ─────────────────────────────────────────────
// SYSTEM INSTRUCTION FOR CHAPTER STREAM
// FIX: GEMINI_HARD_STOPS now included at top.
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
Mimic the EXACT prose construction of this reference text.
Sentence rhythm, paragraph split pattern, vocabulary density, character voice cadence.

REFERENCE TEXT:
"""
${mimicStyleText.trim()}
"""`
    : "";

  return `You are an elite webnovel writer. Your task: write the FULL, detailed narrative of Chapter ${chapterNumber}.

CRITICAL: Do NOT summarize, outline, or skip scenes. Write fully immersive narrative prose at target length. Every beat must be fully written out.

════════════════════════════════════════════════════════
READ THESE RULES FULLY BEFORE WRITING A SINGLE WORD
════════════════════════════════════════════════════════
${GEMINI_HARD_STOPS}

${BASE_PROSE_RULES}
${customProjectRulesStr}
${mimicStyleInstruction}

TONE PRESET: [${toneAdjustment}]

════════════════════════════════════════════════════════
SELF-CHECK — CONFIRM BEFORE FIRST SENTENCE
════════════════════════════════════════════════════════
  ✓ Opening = action or dialogue (NOT weather/atmosphere)
  ✓ No negation framing anywhere
  ✓ Staccato chains merged into flowing sentences
  ✓ Zero banned intensity/cinematic words
  ✓ Zero smell descriptions
  ✓ Background props: no adjectives
  ✓ Every climax beat has a cost or new problem — no clean wins

════════════════════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════════════════════
Return ONLY chapter prose in continuous <p> tags.
No introductions. No author notes. No outlines. No meta-commentary. Just the story.`;
}

// ─────────────────────────────────────────────
// ANTI-SLOP ANALYSIS PROMPT
// ─────────────────────────────────────────────
export function buildSlopAnalysisPrompt(chapterContent: string, synopsis: string): string {
  return `You are an expert webnovel editor specialized in detecting AI-generated writing patterns ("AI slop") in fiction.

Analyze the chapter draft below and return a single valid JSON object. No preamble, no markdown fences, no explanation outside the JSON.

════════════════════════════════════════════════════════
SCORING CONVENTION
════════════════════════════════════════════════════════
All scores range 0–100. Higher = WORSE (more AI-like slop).
overallScore: weighted average. 0 = clean human prose. 100 = pure AI slop.

════════════════════════════════════════════════════════
SUBSCORES
════════════════════════════════════════════════════════
purpleProse: Poetic/cinematic openers, "silence hung like X", weather as scene-setter.
negationPatterns: "Not just X, but Y" / "wasn't merely X" / "bukan sekadar X melainkan Y".
dialogueFormulaic: Same attribution pattern 3+ times in a row without variation.
adverbDensity: Manner adverbs more than once per 200 words; adverb stacking.
clicheIntensity: Banned intensity words — palpable, piercing, "heart hammered", "eyes widened", "breath caught".
propOverdescription: Adjectives on minor background props with no plot relevance.
pacingIssues: (A) paragraphs 4+ sentences / uniform length / slow entry OR (B) staccato single-action sentences.
cleanWinPattern: Protagonist activates power or wins with no cost, no failure, no new problem.

════════════════════════════════════════════════════════
RETURN THIS EXACT JSON STRUCTURE
════════════════════════════════════════════════════════
{
  "overallScore": number,
  "summary": "One paragraph. Biggest problem and single most urgent fix.",
  "scores": {
    "purpleProse": number,
    "negationPatterns": number,
    "dialogueFormulaic": number,
    "adverbDensity": number,
    "clicheIntensity": number,
    "propOverdescription": number,
    "pacingIssues": number,
    "cleanWinPattern": number
  },
  "issues": [
    {
      "id": "unique_id",
      "category": "PurpleProse" | "NegationPattern" | "DialogueFormulaic" | "Adverb" | "ClicheIntensity" | "PropOverdescription" | "Pacing" | "CleanWin",
      "severity": "High" | "Medium" | "Low",
      "originalText": "exact flagged passage copied verbatim",
      "startIndex": number or null,
      "explanation": "specific reason flagged, naming exact rule violated",
      "suggestions": ["concrete drop-in rewrite option 1", "option 2"]
    }
  ]
}

════════════════════════════════════════════════════════
SCORING CALIBRATION
════════════════════════════════════════════════════════
0–20 = Genuinely Human. 21–50 = Mostly Human. 51–75 = AI Fingerprints. 76–100 = AI Generated.
Do NOT give low scores just because prose is grammatically clean — AI text is ALWAYS clean.

${getScoringPenaltyBlock()}

${SUGGESTION_QUALITY_RULES}

════════════════════════════════════════════════════════
PATTERN RULES
════════════════════════════════════════════════════════
${STRUCTURAL_PATTERN_RULES.showVsTellGuard}

${STRUCTURAL_PATTERN_RULES.heroTemplate}

${STRUCTURAL_PATTERN_RULES.predictableSentenceStructure}

BANNED CINEMATIC VOCAB: ${getCinematicVocabString()}
BANNED STOCK IMPACT PHRASES: ${getStockImpactString()}
ENERGY CLUSTER (max ${ENERGY_WORD_MAX_PER_CHAPTER}x each): ${getEnergyWordClusterString()}

════════════════════════════════════════════════════════
ANALYSIS RULES
════════════════════════════════════════════════════════
- Flag ONLY actual violations. Do not flag clean prose.
- originalText must be copied verbatim.
- Each suggestion must be a drop-in replacement: same beat, zero slop.
- Cap total issues at 20. Surface worst ones first.

PROJECT SYNOPSIS (context only):
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

Do NOT flag words that are genuinely the best choice. Only flag when a simpler word would serve equally well or better.

CONTENT TO ANALYZE:
${chapterContent}

Return ONLY valid JSON.`;
}

// ─────────────────────────────────────────────
// PASSAGE POLISH PROMPT
// FIX: Now uses dynamic banned word lists from database instead of hardcoded strings.
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
REWRITE RULES — ALL [P0], NO EXCEPTIONS
════════════════════════════════════════════════════════
[STOP-1] No cinematic/weather/atmosphere openers
[STOP-2] No negation framing ("wasn't just X", "bukan sekadar X melainkan Y")
[STOP-3] No staccato chains — combine continuous actions into one flowing sentence
[STOP-4] No banned intensity words: ${getBannedIntensityString()}
[STOP-4] No banned cinematic words: ${getCinematicVocabString()}
[STOP-4] No absolute banned words: ${ABSOLUTE_BANNED_WORDS.map(w => `"${w}"`).join(", ")}
[STOP-5] No smell descriptions
[STOP-6] No adjectives on background props
[STOP-7] No filler — every sentence must earn its place
[STOP-8] No stock impact phrases: ${getStockImpactString()}
[STOP-10] No clean wins — if this passage ends a conflict, add a cost or new problem

[P1] Keep the same narrative meaning and character actions
[P1] Dialogue uses contractions and natural particles
[P1] Paragraphs 1–3 sentences max

[P2] Simple, direct vocabulary — prefer the shorter word
[P2] No adverb stacking
[P2] Natural, effortless reading flow

OUTPUT: Return ONLY the rewritten passage. No labels. No explanation. No preamble.`;
}