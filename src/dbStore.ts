import { 
  Project, Chapter, Character, Location, NovelGenre, 
  ProjectStatus, ChapterStatus, TensionLevel, SlopCategory, 
  SlopSeverity, IssueActionStatus 
} from "./types";
import { auth } from "./config/firebase";
import { firebaseStore } from "./firebaseStore";


// Keys used in LocalStorage
const PROJECTS_KEY = "novelforge_projects";
const CHAPTERS_KEY = "novelforge_chapters";
const CHARACTERS_KEY = "novelforge_characters";
const LOCATIONS_KEY = "novelforge_locations";

// Helper to generate UUIDs
export function generateUUID(): string {
  return "id-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now().toString(36);
}

// ─── Default Sample Seeding ──────────────────────────────────────────────────
function seedDatabase() {
  const pId = "sec-proj-solo-sovereign";
  
  const sampleProject: Project = {
    id: pId,
    title: "Solo Leveling: Anti-Entropy Sovereign",
    genre: NovelGenre.LitRPG,
    synopsis: "In a world torn by spatial abyssal fissures, the strong dominate through Hunter Matrices. Ryan Vance, a bottom F-tier scavenging hunter, awakened a passive anti-entropy talent 'Overdrive Matrix' allowing him to bypass the heat-death decay of skill gems. Determined to save his sister and conquer the Abyss, he begins his ascent.",
    targetChapterCount: 100,
    defaultPOV: "Ryan Vance",
    antiSlopRules: [
      "Keep game interface descriptions punchy and minimal",
      "Ensure Ryan's monologue highlights tactical planning over unearned arrogance.",
      "Avoid wordy stat-dumps blockades."
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    updatedAt: new Date().toISOString(),
    status: ProjectStatus.Active
  };

  const sampleCharacters: Character[] = [
    {
      id: "char-ryan-vance",
      projectId: pId,
      name: "Ryan Vance",
      aliases: ["Sovereign of Order", "The Scrap-Hunter"],
      age: "21",
      gender: "Male",
      appearance: "A lean youth with charcoal hair, high-collared utility vest, and calloused hands from salvaging high-grade abyss crystal chips.",
      personality: "Pragmatic, dry wit, fiercely loyal to his goals, plans three steps ahead because F-tier hunters don't survive otherwise.",
      backstory: "Grew up in Sector 4 slums. His father was lost in a Rift Raid, leaving Ryan to support his bedridden sister, Lin.",
      arcGoal: "Unlock Tier-10 of the Overdrive core, purge Lin's abyssal corruption, and claim the world's coordinate beacon.",
      powerLevel: "E-rank (Evolving)",
      affiliations: ["Freelance Scavengers", "Fringe Seekers Guild"],
      relationships: [
        {
          targetCharacterId: "char-althea-gray",
          type: "Rival / Ally",
          description: "Stony frost mage who views Ryan as an unpredictable variable, but respects his situational analysis."
        }
      ],
      tags: ["Protagonist", "Tactician", "Adaptive"]
    },
    {
      id: "char-althea-gray",
      projectId: pId,
      name: "Althea Gray",
      aliases: ["Frostweaver Princess"],
      age: "19",
      gender: "Female",
      appearance: "Long platinum-gray hair tied in a practical tail, wielding a reinforced sapphire wand, dressed in heavy winter composite tactical gear.",
      personality: "Pragmatic, reserved, treats dungeon clearance like an analytical math problem. Dislikes rash decisions.",
      backstory: "Second heir to the Gray conglomerate, but left because they restricted her experimental spellcraft modules.",
      arcGoal: "Perfect the 'Absolute Zero' magic circuit independent of corporate sponsorship.",
      powerLevel: "C-rank Elite",
      affiliations: ["Gray Magic Conglomerate (Ex-member)", "Shadow Sector Taskforce"],
      relationships: [
        {
          targetCharacterId: "char-ryan-vance",
          type: "Rival",
          description: "Confused by his low-level rank but extreme dungeon adaptation tactics. Keeps a cautious eye on him."
        }
      ],
      tags: ["Secondary Protagonist", "Mage", "Analytical"]
    }
  ];

  const sampleLocation: Location = {
    id: "loc-sector-4-fissure",
    projectId: pId,
    name: "Sector 4 Rustlands & Crystallized Abyss",
    description: "An abandoned industrial quarry corrupted by rift fallout. Giant steel machines rust amidst shimmering lavender glass dunes and high-intensity magic deposits.",
    atmosphere: "Ominous silence, industrial clack, static electricity discharging from floating crystals.",
    notableFeatures: ["The Sunken Smelter core", "Lavender Fissure path", "Erosion scrap nodes"],
    tags: ["Abyss", "Dungeon", "Industrial"]
  };

  const sampleChapters: Chapter[] = [
    {
      id: "chap-1-seeding",
      projectId: pId,
      chapterNumber: 1,
      title: "Overdrive Core Awakens",
      pov: "Ryan Vance",
      locationId: "loc-sector-4-fissure",
      beats: [
        {
          id: generateUUID(),
          order: 1,
          description: "Ryan Vance scavenges deep inside Sector 4 when a sudden temporal backlash triggers local crystalline anomalies.",
          characterIds: ["char-ryan-vance"],
          tension: TensionLevel.Medium
        },
        {
          id: generateUUID(),
          order: 2,
          description: "A mutated Abyssal Stalker beast ambushes Ryan. He is outmatched and pinned.",
          characterIds: ["char-ryan-vance"],
          tension: TensionLevel.High
        },
        {
          id: generateUUID(),
          order: 3,
          description: "In desperation, he triggers an decaying Core Gem. Instead of shattering, his passive Matrix activates—Overdrive awakened, turning the tide.",
          characterIds: ["char-ryan-vance"],
          tension: TensionLevel.Climax
        }
      ],
      content: `<p>The sirens of Sector 4 had been rusted shut for half a decade, but the air still knew how to scream. Under the neon-tinted smog, Ryan Vance adjusted the frayed leather seal of his respirator, holding his breath as his scanner flickered. </p>
<p>“Three units left. Just three more shards of crystalline scrap, and Lin gets another week of atmospheric filters,” Ryan muttered. His hand, calloused and smudged with iron soot, guided a specialized pulse wrench into the battery casing of a dormant Titan-loader. </p>
<p>Suddenly, the lavender crystals encrusted across the quarry walls flashed with a violent, electric glare. A low hum vibrated directly up from his boots. It wasn't the sound of machinery. It was the crushing static of an Abyssal fissure collapsing inward.</p>
<p>From the shadows of the twisted metal crane overhead, something massive and fluid detached itself. A mutated Abyssal Stalker, its torso a cluster of jagged purple ores and long, double-jointed legs, hissed. Its pitch-black head swung down, targeting Ryan. </p>
<p>“Of course,” Ryan muttered dryly, throwing himself sideways just as the stalker crashed into his previous position. The steel plates beneath his boots buckled as if struck by a hydraulic ram. If he got hit even once, F-rank defenses wouldn't just breach; they would disintegrate.</p>
<p>He pulled out a decaying E-tier Combat Matrix Core from his pocket—a dirty, cracked sapphire gem. It was highly unstable, leaking blue power mist. Running it directly into his interface would usually explode the channel. But with his back against the vibrating loader, Ryan slammed the shattered core into his hunter slot anyway. </p>
<p>[WARNING: Core structural integrity at 4%. Decay failure imminent—]</p>
<p>“Imminent my foot. Overdrive Matrix, engage. Suppress heat-death!” Ryan yelled, forcing his willpower directly into the system circuit. The sapphire gem flared, the cracks glowing white-hot. Instead of exploding, the decay reversed in a sudden spiral of absolute, mathematical order. </p>
<p>[EMERGENCY INTRUSION: Anti-Entropy sovereign core identified. Repairing circuit...]</p>
<p>The F-level scrap hunter felt a sudden rush of freezing energy course through his blood, and he smiled as he watched the glowing blade of energy coalesce in his hands.</p>`,
      wordCount: 384,
      summary: "Ryan Vance scavenges in Sector 4 Rustlands and wakes an Abyssal Stalker. Cornered, he inserts a corrupt Core Gem and unlocks his anti-entropy passive, Overdrive, repairing the crumbling matrix.",
      status: ChapterStatus.Draft,
      slopScore: 78,
      analysisHistory: [
        { overallScore: 65, analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
        { overallScore: 78, analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }
      ],
      latestAnalysis: {
        overallScore: 78,
        scores: {
          purpleProse: 85,
          adverbDensity: 70,
          dialogueQuality: 92,
          pacing: 75,
          clicheCount: 65,
          showVsTell: 80
        },
        issues: [
          {
            id: "issue-1",
            category: SlopCategory.PurpleProse,
            severity: SlopSeverity.Medium,
            originalText: "crystalline shards of lavender glass dunes and high-intensity magic deposits",
            suggestions: ["shimmering lavender glass dunes", "dense crystalline formations"],
            explanation: "Combines multiple bloated sensory adjectives where a single strong atmospheric noun would keep webnovel pacing tight.",
            status: IssueActionStatus.Pending
          },
          {
            id: "issue-2",
            category: SlopCategory.Adverb,
            severity: SlopSeverity.Low,
            originalText: "Ryan adjusted the respirator, holding his breath as his scanner flickered deeply",
            suggestions: ["his scanner flickered erraticly", "his scanner stuttered"],
            explanation: "Excessive passive adverb usage slows down scene setup. Use an active verb instead.",
            status: IssueActionStatus.Pending
          }
        ],
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      versions: [
        {
          id: "ver-1",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          label: "Initial generation draft",
          content: "<p>Ryan adjusted his respirator. The atmosphere was incredibly toxic. Suddenly, a beast ambushed him. He grabbed a cracked core and slammed it in. Overdrive activated.</p>",
          wordCount: 26
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "chap-2-seeding",
      projectId: pId,
      chapterNumber: 2,
      title: "Shadows of Gray Magic",
      pov: "Ryan Vance",
      locationId: "loc-sector-4-fissure",
      beats: [
        {
          id: generateUUID(),
          order: 1,
          description: "Ryan examines the defeated Abyssal Stalker's crystal remains, finding an abnormal high-grade core.",
          characterIds: ["char-ryan-vance"],
          tension: TensionLevel.Low
        },
        {
          id: generateUUID(),
          order: 2,
          description: "Althea Gray, tracing the energy flare from the smelter core, confronts him about his illegal awakening.",
          characterIds: ["char-ryan-vance", "char-althea-gray"],
          tension: TensionLevel.Medium
        }
      ],
      content: "",
      wordCount: 0,
      summary: "",
      status: ChapterStatus.Planned,
      slopScore: null,
      analysisHistory: [],
      versions: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Save seed to localStorage
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([sampleProject]));
  localStorage.setItem(CHARACTERS_KEY, JSON.stringify(sampleCharacters));
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify([sampleLocation]));
  localStorage.setItem(CHAPTERS_KEY, JSON.stringify(sampleChapters));
}

// Ensure seeded on first load
if (!localStorage.getItem(PROJECTS_KEY)) {
  seedDatabase();
}

// ─── CRUD Storage Helpers ───────────────────────────────────────────────────

export const dbStore = {
  // --- Projects ---
  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  
  saveProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  createProject(title: string, genre: NovelGenre, synopsis: string, targetCount: number, defaultPOV: string): Project {
    const projects = this.getProjects();
    const newProj: Project = {
      id: generateUUID(),
      title,
      genre,
      synopsis,
      targetChapterCount: targetCount,
      defaultPOV,
      antiSlopRules: [
        "WRITE IN A NATURAL, GROUNDED, FLUID, AND HUMAN WRITING STYLE - STRICTLY AVOID AI SLOP, COLDNESS, AND CLICHÉS.",
        "WEBNOVEL MICRO-PARAGRAPH FORMATTING: Keep paragraphs concise (1 to 3 sentences max per paragraph) for mobile screens, but ensure the narrative flows smoothly and naturally. Do not write choppy or artificially fragmented staccato sentences.",
        "DIALOGUE DENSITY: Aim for high dialogue density where 30% to 50% of the chapter consists of direct character speech and back-and-forth interactions.",
        "BAHASA SEDERHANA & BERKUALITAS: Write in clear, transparent, and direct language. Avoid overly flowery prose, heavy meta-exposition, or long lectures about world lore.",
        "CONCISE BACKGROUND OBJECTS: Keep descriptions of minor background items simple and focused. Do not over-decorate non-essential scenery.",
        "NATURAL DIALOGUE FLOW: Use tagless dialogue when the speaker is clear, and blend speech with actions without using repetitive tag formulas. Use natural spoken register particles (e.g. sih, kok, kan, dong, ya, aja, deh).",
        "ACTIVE SENTENCE STRUCTURES: Prioritize active and positive descriptions. Normal negations are fine to use naturally, but focus on keeping the pace dynamic.",
        "ABSOLUTE BAN ON SMELLS & BANNED WORDS: Never describe smells, odors, or olfactory atmospheres under any circumstances. Strictly ban the word 'ozone' (or 'ozon')."
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: ProjectStatus.Active
    };
    projects.push(newProj);
    this.saveProjects(projects);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveProject(userId, newProj).catch(e => console.error("Error saving project to cloud:", e));
    }

    return newProj;
  },

  updateProject(id: string, updates: Partial<Project>): Project {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Project not found.");
    projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveProjects(projects);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveProject(userId, projects[idx]).catch(e => console.error("Error updating project in cloud:", e));
    }

    return projects[idx];
  },

  deleteProject(id: string): void {
    const projects = this.getProjects().filter(p => p.id !== id);
    this.saveProjects(projects);
    
    // Cascading deletions: retrieve global lists, filter out this project, and store back
    const allChapters = this.getChapters().filter(c => c.projectId !== id);
    this.saveChapters(allChapters);
    
    const allCharacters = this.getCharacters().filter(c => c.projectId !== id);
    this.saveCharacters(allCharacters);
    
    const allLocations = this.getLocations().filter(l => l.projectId !== id);
    this.saveLocations(allLocations);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.deleteProject(userId, id).catch(e => console.error("Error deleting project from cloud:", e));
    }
  },

  // --- Chapters ---
  getChapters(projectId?: string): Chapter[] {
    try {
      const data = localStorage.getItem(CHAPTERS_KEY);
      const all: Chapter[] = data ? JSON.parse(data) : [];
      if (projectId) {
        return all.filter(c => c.projectId === projectId).sort((a, b) => a.chapterNumber - b.chapterNumber);
      }
      return all;
    } catch {
      return [];
    }
  },

  saveChapters(chapters: Chapter[]): void {
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(chapters));
  },

  createChapter(projectId: string, title: string, chapterNumber: number, pov: string, locationId?: string): Chapter {
    const chapters = this.getChapters();
    const newChap: Chapter = {
      id: generateUUID(),
      projectId,
      chapterNumber,
      title,
      pov,
      locationId,
      beats: [],
      content: "",
      wordCount: 0,
      summary: "",
      status: ChapterStatus.Planned,
      slopScore: null,
      analysisHistory: [],
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    chapters.push(newChap);
    this.saveChapters(chapters);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveChapter(userId, newChap).catch(e => console.error("Error saving chapter to cloud:", e));
    }

    return newChap;
  },

  updateChapter(id: string, updates: Partial<Chapter>): Chapter {
    const chapters = this.getChapters();
    const idx = chapters.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Chapter not found.");
    
    // calculate word count helper
    let wordCount = chapters[idx].wordCount;
    if (updates.content !== undefined) {
      const plain = updates.content.replace(/<[^>]*>/g, " ").trim();
      wordCount = plain ? plain.split(/\s+/).length : 0;
    }

    chapters[idx] = { 
      ...chapters[idx], 
      ...updates, 
      wordCount: updates.content !== undefined ? wordCount : chapters[idx].wordCount,
      updatedAt: new Date().toISOString() 
    };
    this.saveChapters(chapters);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveChapter(userId, chapters[idx]).catch(e => console.error("Error updating chapter in cloud:", e));
    }

    return chapters[idx];
  },

  deleteChapter(id: string): void {
    const chapters = this.getChapters().filter(c => c.id !== id);
    this.saveChapters(chapters);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.deleteChapter(userId, id).catch(e => console.error("Error deleting chapter from cloud:", e));
    }
  },

  // --- Characters ---
  getCharacters(projectId?: string): Character[] {
    try {
      const data = localStorage.getItem(CHARACTERS_KEY);
      const all: Character[] = data ? JSON.parse(data) : [];
      if (projectId) {
        return all.filter(c => c.projectId === projectId);
      }
      return all;
    } catch {
      return [];
    }
  },

  saveCharacters(characters: Character[]): void {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
  },

  createCharacter(projectId: string, name: string): Character {
    const characters = this.getCharacters();
    const newChar: Character = {
      id: generateUUID(),
      projectId,
      name,
      aliases: [],
      age: "",
      gender: "",
      appearance: "",
      personality: "",
      backstory: "",
      arcGoal: "",
      powerLevel: "",
      affiliations: [],
      relationships: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    characters.push(newChar);
    this.saveCharacters(characters);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveCharacter(userId, newChar).catch(e => console.error("Error saving character to cloud:", e));
    }

    return newChar;
  },

  updateCharacter(id: string, updates: Partial<Character>): Character {
    const characters = this.getCharacters();
    const idx = characters.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Character not found.");
    characters[idx] = { ...characters[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCharacters(characters);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveCharacter(userId, characters[idx]).catch(e => console.error("Error updating character in cloud:", e));
    }

    return characters[idx];
  },

  deleteCharacter(id: string): void {
    const characters = this.getCharacters().filter(c => c.id !== id);
    this.saveCharacters(characters);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.deleteCharacter(userId, id).catch(e => console.error("Error deleting character from cloud:", e));
    }
  },

  // --- Locations ---
  getLocations(projectId?: string): Location[] {
    try {
      const data = localStorage.getItem(LOCATIONS_KEY);
      const all: Location[] = data ? JSON.parse(data) : [];
      if (projectId) {
        return all.filter(l => l.projectId === projectId);
      }
      return all;
    } catch {
      return [];
    }
  },

  saveLocations(locations: Location[]): void {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  },

  createLocation(projectId: string, name: string): Location {
    const locations = this.getLocations();
    const newLoc: Location = {
      id: generateUUID(),
      projectId,
      name,
      description: "",
      atmosphere: "",
      notableFeatures: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    locations.push(newLoc);
    this.saveLocations(locations);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveLocation(userId, newLoc).catch(e => console.error("Error saving location to cloud:", e));
    }

    return newLoc;
  },

  updateLocation(id: string, updates: Partial<Location>): Location {
    const locations = this.getLocations();
    const idx = locations.findIndex(l => l.id === id);
    if (idx === -1) throw new Error("Location not found.");
    locations[idx] = { ...locations[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveLocations(locations);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.saveLocation(userId, locations[idx]).catch(e => console.error("Error updating location in cloud:", e));
    }

    return locations[idx];
  },

  deleteLocation(id: string): void {
    const locations = this.getLocations().filter(l => l.id !== id);
    this.saveLocations(locations);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firebaseStore.deleteLocation(userId, id).catch(e => console.error("Error deleting location from cloud:", e));
    }
  },

  // ─── AI API Layer integration calls ─────────────────────────────────────────

  /**
   * Triggers chunk-by-chunk draft generation from our full-stack /api/generate-stream route.
   */
  async generateChapterStream(
    prompt: string, 
    systemInstruction: string, 
    onChunk: (text: string) => void,
    onFinish: () => void,
    onError: (err: string) => void
  ) {
    try {
      const response = await fetch("/api/generate-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
        },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No readable response body stream from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value, { stream: true });
        onChunk(textChunk);
      }
      
      onFinish();
    } catch (err: any) {
      console.error(err);
      onError(err.message || String(err));
    }
  },

  /**
   * Calls /api/analyze-slop to receive scores and highlight locations.
   */
  async analyzeSlop(content: string): Promise<any> {
    const response = await fetch("/api/analyze-slop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Analysis failed with status ${response.status}`);
    }

    return response.json();
  },
  
  /**
   * Calls /api/analyze-vocab to scan chapter content for pretentious, stiff or overly academic vocabulary.
   */
  async analyzeVocab(content: string): Promise<any> {
    const response = await fetch("/api/analyze-vocab", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Vocabulary check failed with status ${response.status}`);
    }

    return response.json();
  },

  /**
   * Calls /api/polish for individual selected text rewrites.
   */
  async polishText(text: string, instruction: string, contextStyle: string): Promise<string> {
    const response = await fetch("/api/polish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
      },
      body: JSON.stringify({ text, instruction, contextStyle })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Polish request failed");
    }

    const data = await response.json();
    return data.polishedText || text;
  },

  /**
   * Calls /api/generate-timeline to generate a structured non-slop sequence.
   */
  async generateTimeline(
    characters: Character[],
    locations: Location[],
    genre: string,
    synopsis: string,
    antiSlopRules: string[]
  ): Promise<any> {
    const response = await fetch("/api/generate-timeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
      },
      body: JSON.stringify({ characters, locations, genre, synopsis, antiSlopRules })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to generate timeline with status ${response.status}`);
    }

    return response.json();
  }
};
