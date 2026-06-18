export enum NovelGenre {
  LitRPG = "LitRPG",
  Isekai = "Isekai",
  Fantasy = "Fantasy",
  System = "System",
  Apocalypse = "Apocalypse",
  Xianxia = "Xianxia",
  Other = "Other"
}

export enum ProjectStatus {
  Active = "Active",
  Draft = "Draft",
  Complete = "Complete",
  Archived = "Archived"
}

export enum ChapterStatus {
  Planned = "Planned",
  Draft = "Draft",
  Writing = "Writing",
  Review = "Review",
  Done = "Done"
}

export enum TensionLevel {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Climax = "Climax"
}

export enum SlopCategory {
  PurpleProse = "PurpleProse",
  Adverb = "Adverb",
  Dialogue = "Dialogue",
  Pacing = "Pacing",
  Cliché = "Cliché",
  ShowVsTell = "ShowVsTell",
  NegationPattern = "NegationPattern",
  DialogueFormulaic = "DialogueFormulaic",
  ClicheIntensity = "ClicheIntensity",
  PropOverdescription = "PropOverdescription"
}

export enum SlopSeverity {
  Low = "Low",
  Medium = "Medium",
  High = "High"
}

export enum IssueActionStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Rejected = "Rejected",
  CustomEdited = "CustomEdited"
}

export interface Relationship {
  targetCharacterId: string;
  type: string;        // e.g., "Rival", "Ally", "Romantic Interest"
  description: string; // e.g., "Secretly admires competence but acts aggressive"
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  aliases: string[];
  age: string;
  gender: string;
  appearance: string;
  personality: string;
  backstory: string;
  arcGoal: string;
  powerLevel: string;
  affiliations: string[];
  firstAppearance?: number;
  relationships: Relationship[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  projectId: string;
  name: string;
  description: string;
  atmosphere: string;
  notableFeatures: string[];
  firstAppearance?: number;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Beat {
  id: string;
  order: number;
  description: string;
  characterIds: string[];
  tension: TensionLevel;
}

export interface ChapterVersion {
  id: string;
  timestamp: string;
  label: string;
  content: string;
  wordCount: number;
}

export interface SlopIssue {
  id: string; // Generated on client
  category: SlopCategory;
  severity: SlopSeverity;
  originalText: string;
  suggestions: string[];
  explanation: string;
  status: IssueActionStatus;
}

export interface SlopScoreBreakdown {
  purpleProse: number;
  adverbDensity: number;
  dialogueQuality: number;
  pacing: number;
  clicheCount: number;
  showVsTell: number;
  negationPatterns?: number;
  dialogueFormulaic?: number;
  clicheIntensity?: number;
  propOverdescription?: number;
  pacingIssues?: number;
}

export interface SlopAnalysis {
  overallScore: number;
  scores: SlopScoreBreakdown;
  issues: SlopIssue[];
  analyzedAt: string;
}

export interface VocabIssue {
  id: string; // generated on client/server
  originalText: string; // sentence or clause containing the word
  word: string; // specific word that is too complex, formal, or kaku
  explanation: string; // why it's stiff / academic
  suggestions: string[]; // simpler alternatives
  status: IssueActionStatus;
}

export interface VocabAnalysis {
  issues: VocabIssue[];
  analyzedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  chapterNumber: number;
  title: string;
  pov: string; // defaultPOV or specific character name
  locationId?: string;
  beats: Beat[];
  content: string; // Plaintext or basic formatted paragraphs
  wordCount: number;
  summary: string; // Auto-generated 2-3 sentence summary
  status: ChapterStatus;
  slopScore: number | null;
  analysisHistory: { overallScore: number; analyzedAt: string }[];
  latestAnalysis?: SlopAnalysis | null;
  latestVocabAnalysis?: VocabAnalysis | null;
  versions: ChapterVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  genre: NovelGenre;
  synopsis: string;
  targetChapterCount: number;
  defaultPOV: string;
  antiSlopRules: string[];
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  styleReferenceText?: string;
}
