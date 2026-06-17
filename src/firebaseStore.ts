import { db } from "./config/firebase";
import { 
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, where 
} from "firebase/firestore";
import { Project, Chapter, Character, Location } from "./types";

export const firebaseStore = {
  /**
   * Syncs all data from Cloud Firestore to the app's local storage and state.
   */
  async syncAllFromCloud(userId: string): Promise<{
    projects: Project[];
    chapters: Chapter[];
    characters: Character[];
    locations: Location[];
  }> {
    if (!userId) throw new Error("No user authenticated.");

    // Fetch projects
    const projSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));
    const projects: Project[] = [];
    projSnap.forEach((doc) => {
      const data = doc.data();
      // Remove userId from mapping to standard Project interface
      const { userId: _, ...projectData } = data;
      projects.push({ id: doc.id, ...projectData } as Project);
    });

    // Fetch chapters
    const chapSnap = await getDocs(query(collection(db, "chapters"), where("userId", "==", userId)));
    const chapters: Chapter[] = [];
    chapSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...chapterData } = data;
      chapters.push({ id: doc.id, ...chapterData } as Chapter);
    });

    // Fetch characters
    const charSnap = await getDocs(query(collection(db, "characters"), where("userId", "==", userId)));
    const characters: Character[] = [];
    charSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...characterData } = data;
      characters.push({ id: doc.id, ...characterData } as Character);
    });

    // Fetch locations
    const locSnap = await getDocs(query(collection(db, "locations"), where("userId", "==", userId)));
    const locations: Location[] = [];
    locSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...locationData } = data;
      locations.push({ id: doc.id, ...locationData } as Location);
    });

    // Save back to local storage so Offline/Instant load works perfectly
    localStorage.setItem("novelforge_projects", JSON.stringify(projects));
    localStorage.setItem("novelforge_chapters", JSON.stringify(chapters));
    localStorage.setItem("novelforge_characters", JSON.stringify(characters));
    localStorage.setItem("novelforge_locations", JSON.stringify(locations));

    return { projects, chapters, characters, locations };
  },

  /**
   * Uploads current local storage data to the Cloud under the logged-in user.
   */
  async uploadLocalToCloud(userId: string): Promise<void> {
    if (!userId) return;

    // Get all local items
    const localProjectsStr = localStorage.getItem("novelforge_projects");
    const localChaptersStr = localStorage.getItem("novelforge_chapters");
    const localCharactersStr = localStorage.getItem("novelforge_characters");
    const localLocationsStr = localStorage.getItem("novelforge_locations");

    const projects: Project[] = localProjectsStr ? JSON.parse(localProjectsStr) : [];
    const chapters: Chapter[] = localChaptersStr ? JSON.parse(localChaptersStr) : [];
    const characters: Character[] = localCharactersStr ? JSON.parse(localCharactersStr) : [];
    const locations: Location[] = localLocationsStr ? JSON.parse(localLocationsStr) : [];

    // Save with batch/individual setDoc to cloud
    for (const proj of projects) {
      await setDoc(doc(db, "projects", proj.id), { ...proj, userId });
    }
    for (const chap of chapters) {
      await setDoc(doc(db, "chapters", chap.id), { ...chap, userId });
    }
    for (const char of characters) {
      await setDoc(doc(db, "characters", char.id), { ...char, userId });
    }
    for (const loc of locations) {
      await setDoc(doc(db, "locations", loc.id), { ...loc, userId });
    }
  },

  /**
   * Cloud set helpers
   */
  async saveProject(userId: string, project: Project): Promise<void> {
    await setDoc(doc(db, "projects", project.id), { ...project, userId });
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    await deleteDoc(doc(db, "projects", projectId));
    
    // Batch deletes of related records in cloud
    const chapSnap = await getDocs(query(collection(db, "chapters"), where("userId", "==", userId), where("projectId", "==", projectId)));
    chapSnap.forEach(async (document) => {
      await deleteDoc(doc(db, "chapters", document.id));
    });

    const charSnap = await getDocs(query(collection(db, "characters"), where("userId", "==", userId), where("projectId", "==", projectId)));
    charSnap.forEach(async (document) => {
      await deleteDoc(doc(db, "characters", document.id));
    });

    const locSnap = await getDocs(query(collection(db, "locations"), where("userId", "==", userId), where("projectId", "==", projectId)));
    locSnap.forEach(async (document) => {
      await deleteDoc(doc(db, "locations", document.id));
    });
  },

  async saveChapter(userId: string, chapter: Chapter): Promise<void> {
    await setDoc(doc(db, "chapters", chapter.id), { ...chapter, userId });
  },

  async deleteChapter(userId: string, chapterId: string): Promise<void> {
    await deleteDoc(doc(db, "chapters", chapterId));
  },

  async saveCharacter(userId: string, character: Character): Promise<void> {
    await setDoc(doc(db, "characters", character.id), { ...character, userId });
  },

  async deleteCharacter(userId: string, characterId: string): Promise<void> {
    await deleteDoc(doc(db, "characters", characterId));
  },

  async saveLocation(userId: string, location: Location): Promise<void> {
    await setDoc(doc(db, "locations", location.id), { ...location, userId });
  },

  async deleteLocation(userId: string, locationId: string): Promise<void> {
    await deleteDoc(doc(db, "locations", locationId));
  }
};
