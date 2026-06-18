/**
 * ai-slop-database.ts
 *
 * Centralized AI slop word/pattern database.
 * Single source of truth for ALL banned words, pattern rules, and scoring weights.
 * Import from this file in any prompt builder or server endpoint.
 *
 * To add new banned words or patterns: edit ONLY this file.
 * Changes here automatically propagate to:
 *   - Chapter generation system instructions
 *   - Anti-slop audit prompts
 *   - Vocab simplicity checker
 *   - Suggestion quality validation
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: BANNED WORD LISTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic AI buzzwords that appear in nearly all AI-generated fiction.
 * Using any of these is a clear AI fingerprint.
 */
export const AI_BUZZWORDS = [
  "delve", "tapestry", "testament", "intricate", "beacon",
  "multifaceted", "clandestine", "crescendo", "pivotal", "catalyst",
  "symphony of", "whispering secrets", "dangerous dance", "complex web",
  "a sense of", "not only... but also", "gaze", "orbs",
  "ultimate", "unravel", "underscore", "resonate", "embark",
  "leverage", "landscape", "realm", "paradigm", "unleash",
];

/**
 * Cinematic/sci-fi atmosphere words overused by AI in fantasy/action scenes.
 * These should NEVER be used as atmospheric shorthand — replace with specific physical detail.
 */
export const CINEMATIC_SCIFI_VOCAB = [
  "shimmered", "shimmer",
  "flickered", "flicker",
  "pulsed", "pulse",
  "warped", "warping",
  "jagged shapes", "jagged",
  "cascading", "cascade",
  "ethereal",
  "ambient energy",
  "corrupted",           // as an aesthetic descriptor
  "suffused",
  "radiated",            // when describing ambient light/energy
];

/**
 * Theatrical intensity words that always sound unearned and AI-generated.
 * Banned from narration. Only allowed once per chapter if a scene TRULY earns it.
 */
export const BANNED_INTENSITY_WORDS = [
  "palpable",
  "piercing",
  "visceral",
  "electrifying",
  "haunting",
  "suffocating",
  "oppressive",
  "heavy silence",
  "oppressive air",
  "shiver ran down his spine",
  "shiver ran down her spine",
  "heart hammered",
  "heart pounded",
  "eyes widened",
  "breath caught in his throat",
  "breath caught in her throat",
  "swallowed hard",
  "biting her lower lip",
  "biting his lower lip",
  "let out a breath he didn't know he was holding",
  "let out a breath she didn't know she was holding",
];

/**
 * Stock physical impact/injury descriptions used as AI safety-templates.
 * Replace with body-part-specific, character-personal descriptions.
 */
export const STOCK_IMPACT_PHRASES = [
  "knocked the wind out of him",
  "knocked the wind out of her",
  "ribs creaking under the strain",
  "pain exploded through his body",
  "pain exploded through her body",
  "bit back a scream",
  "impact resonated through",
  "sent shockwaves through his body",
  "his vision swam",
  "her vision swam",
  "stars burst across his vision",
  "stars burst across her vision",
];

/**
 * Negation-framing contrast clichés — defining something by saying what it is NOT.
 * These delay the actual point and are a classic AI hallmark.
 * Examples of banned patterns (not literal strings — regex-style concepts):
 */
export const NEGATION_PATTERN_EXAMPLES = [
  "That wasn't just a bet. It was a guarantee.",
  "It wasn't merely fear. It was something deeper.",
  "Bukan sekadar ancaman. Itu perintah.",
  "Not anger, but fear...",
  "It wasn't a warning, just an instruction.",
  "bukan sekadar X melainkan Y",
  "Not [X], but [Y]",
  "wasn't merely [X], it was [Y]",
];

/**
 * Energy/power theme word cluster. In a ~1500-word chapter, each of these
 * may appear MAX 3 times. After 3 uses, rotate to synonyms.
 */
export const ENERGY_WORD_CLUSTER = [
  "glowing", "glow",
  "energy",
  "core",
  "crystal",
  "system",
  "power",
  "matrix",
  "aura",
  "radiance",
];

export const ENERGY_WORD_MAX_PER_CHAPTER = 3;

/**
 * Absolute hard bans — these words are NEVER acceptable in any context.
 */
export const ABSOLUTE_BANNED_WORDS = [
  "ozone", "ozon",
  "delve", "tapestry", "resonate", "embark", "unleash",
  "paradigm", "realm", "beacon", "crescendo",
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: STRUCTURAL PATTERN RULES (descriptions for prompt injection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Describes the AI structural fingerprint patterns to detect in audit prompts.
 */
export const STRUCTURAL_PATTERN_RULES = {
  /**
   * The A→D→E→D rhythm: AI tends to write paragraphs as:
   * Action → Description → Explanation → Dialogue, repeatedly.
   */
  predictableSentenceStructure: `
PREDICTABLE SENTENCE STRUCTURE (AI Structural Fingerprint):
Passages that follow a rigid, clean, repeating formula: Action → Description → Explanation → Dialogue,
in that exact order, repeatedly. Real human prose jumps focus, starts mid-scene, or leads with
dialogue unexpectedly. Flag any block where 3+ consecutive paragraphs follow the same A→D→E→D sequence.
  `.trim(),

  /**
   * Hero template: protagonist is always calm, correct, and tactical.
   */
  heroTemplate: `
EMOTIONALLY PERFECT / "HERO TEMPLATE" PROTAGONIST:
Protagonist reactions that are always calm, controlled, and analytically correct under pressure.
Flag dialogue or action where the POV character is: steadying their voice under adrenaline,
immediately correctly analyzing the enemy, or producing a cool comeback without missing a beat.
Real characters miscalculate, panic briefly, or have a wrong first instinct.
Flag the "hero template" pattern: steady voice + perfect situational read + cool line.
  `.trim(),

  /**
   * ShowVsTell false-positive guard — short punchy sentences are human, not AI.
   */
  showVsTellGuard: `
TELLING INSTEAD OF SHOWING — HEAVY EXPOSITION ONLY (NOT short punchy sentences):
ONLY flag this when a character's internal state, emotion, or tension is explained across MULTIPLE
consecutive sentences of pure narrator summary with NO physical grounding.
CRITICAL FALSE-POSITIVE GUARD: Do NOT flag short, punchy one-liner observations like
"The quiet in Sector 4 was always a bad sign." — these are a HUMAN writing technique.
ONLY flag ShowVsTell when you see 2+ consecutive sentences that explain emotions abstractly.
Do NOT flag sentences that use 'always', 'never', 'usually' as the only qualifier.
  `.trim(),

  /**
   * Prop over-description: giving minor background objects theatrical adjectives.
   */
  propOverdescription: `
PROP OVER-DESCRIPTION:
Decorating background objects with adjective stacks that have zero plot relevance.
Flag: "rusted hydraulics", "weathered metal", "crumbling concrete", "narrow service hatch",
"dimly lit corridor". These should just be "the door", "the hatch", "the corridor".
  `.trim(),
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: SCORING PENALTIES (used in audit calibration)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard scoring penalties applied to overallScore (Slop Index).
 * 0 = unmistakably human. 100 = pure AI slop.
 */
export const SCORING_PENALTIES = {
  perNewPatternInstance: 8,       // Patterns 9-13 (structural/cinematic/hero/repetition/impact)
  perClassicSlopInstance: 5,      // Patterns 1-8 (buzzwords, negation, staccato, etc.)
  protagonistAlwaysCalm: 15,      // Entire chapter: protagonist never miscalculates
  repeatingParagraphRhythm: 12,   // 3+ paragraphs with identical A→D→E→D structure
  perCinematicVocabWord: 6,       // Each instance of CINEMATIC_SCIFI_VOCAB
  perBannedIntensityWord: 5,      // Each instance of BANNED_INTENSITY_WORDS
  perStockImpactPhrase: 8,        // Each instance of STOCK_IMPACT_PHRASES
  perNegationPattern: 5,          // Each instance of NEGATION_PATTERN_EXAMPLES
  energyWordSaturation: 10,       // Any energy word cluster member appearing 4+ times
} as const;

/**
 * Score bracket interpretations for Slop Index (lower is better).
 */
export const SCORE_BRACKETS = [
  { min: 0,  max: 20,  label: "Genuinely Human", color: "#00FF88",
    description: "Reads like a real author with natural imperfections and unexpected choices." },
  { min: 21, max: 50,  label: "Mostly Human",   color: "#88FF00",
    description: "Good but has some AI smoothness — fixable with targeted revision." },
  { min: 51, max: 75,  label: "AI Fingerprints", color: "#FFAA00",
    description: "Technically competent AI output with clear structural patterns." },
  { min: 76, max: 100, label: "AI Generated",   color: "#FF4444",
    description: "Unmistakably AI-generated. Heavy revision needed." },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: SUGGESTION QUALITY CONTROL RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rules the audit must follow when generating rewrite suggestions.
 * These prevent the auditor from producing AI slop in its own output.
 */
export const SUGGESTION_QUALITY_RULES = `
SUGGESTION QUALITY CONTROL — MANDATORY:
Your rewrite suggestions MUST NOT themselves be AI slop. Before finalizing any suggestion:

BANNED IN SUGGESTIONS:
- "hung heavy", "thick enough to choke on", "palpable", "pressing silence", "weight of", "permeated",
  "suffocating", any metaphor comparing silence/air to physical thickness.
- Cinematic words: shimmered, flickered, pulsed, ethereal, cascading, warped, jagged.
- Replacing a short punchy sentence (under 12 words) with a longer theatrical description.
  If the original is under 12 words, the suggestion must also be under 15 words.
- Bloated poetic rewrites of simple direct sentences.

REQUIRED IN SUGGESTIONS:
- Write as a human author would — direct, grounded, specific.
- If you cannot improve on the original without making it worse, DO NOT FLAG IT.
- Suggestions must be same-length or shorter than originals when the original is already concise.

EXAMPLE OF FORBIDDEN BEHAVIOR:
  Original: "The quiet in Sector 4 was always a bad sign."   ← GOOD. Do not flag.
  Bad suggestion: "The silence in Sector 4 hung heavy, thick enough to choke on."  ← WORSE. AI slop.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: HELPER — Build flat string lists for prompt injection
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a bullet-list string of all absolutely banned words for prompt injection. */
export function getBannedWordListString(): string {
  const all = [
    ...ABSOLUTE_BANNED_WORDS,
    ...AI_BUZZWORDS.slice(0, 15), // top 15 most common
  ];
  return all.map(w => `"${w}"`).join(", ");
}

/** Returns a bullet-list string of cinematic vocab for prompt injection. */
export function getCinematicVocabString(): string {
  return CINEMATIC_SCIFI_VOCAB.map(w => `"${w}"`).join(", ");
}

/** Returns a bullet-list string of intensity words for prompt injection. */
export function getBannedIntensityString(): string {
  return BANNED_INTENSITY_WORDS.map(w => `"${w}"`).join(", ");
}

/** Returns the stock impact phrases as a bullet list for prompt injection. */
export function getStockImpactString(): string {
  return STOCK_IMPACT_PHRASES.map(p => `"${p}"`).join(", ");
}

/** Returns the energy word cluster as a comma-separated string for prompt injection. */
export function getEnergyWordClusterString(): string {
  return ENERGY_WORD_CLUSTER.map(w => `'${w}'`).join(", ");
}

/** Returns the scoring penalty block as formatted text for prompt injection. */
export function getScoringPenaltyBlock(): string {
  return `
HARD SCORING PENALTIES (apply by adding to the overall Slop Index, starting at 0):
- Each AI structural pattern instance (patterns 9-13): +${SCORING_PENALTIES.perNewPatternInstance} pts
- Each classic slop marker (patterns 1-8): +${SCORING_PENALTIES.perClassicSlopInstance} pts
- Protagonist always calm/correct throughout: +${SCORING_PENALTIES.protagonistAlwaysCalm} pts
- 3+ consecutive paragraphs with same rhythm: +${SCORING_PENALTIES.repeatingParagraphRhythm} pts
- Each cinematic vocab word (${getCinematicVocabString()}): +${SCORING_PENALTIES.perCinematicVocabWord} pts
- Each energy cluster word appearing 4+ times: +${SCORING_PENALTIES.energyWordSaturation} pts
- A perfectly human text starts at 0. Clean text with AI fingerprints should score 40–60. Pure AI text scores 80+.
  `.trim();
}
