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

    const getTimestamp = (dateStr?: string | null): number => {
      if (!dateStr) return 0;
      const t = new Date(dateStr).getTime();
      return isNaN(t) ? 0 : t;
    };

    // --- 1. PROJECTS ---
    const projSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));
    const cloudProjectsMap = new Map<string, Project>();
    projSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...projectData } = data;
      cloudProjectsMap.set(doc.id, { id: doc.id, ...projectData } as Project);
    });

    const localProjectsStr = localStorage.getItem("novelforge_projects");
    const localProjects: Project[] = localProjectsStr ? JSON.parse(localProjectsStr) : [];
    const localProjectsMap = new Map<string, Project>(localProjects.map(p => [p.id, p]));

    const allProjectIds = new Set([...cloudProjectsMap.keys(), ...localProjectsMap.keys()]);
    const mergedProjects: Project[] = [];

    for (const id of allProjectIds) {
      const localProj = localProjectsMap.get(id);
      const cloudProj = cloudProjectsMap.get(id);

      if (localProj && cloudProj) {
        const localTime = getTimestamp(localProj.updatedAt);
        const cloudTime = getTimestamp(cloudProj.updatedAt);
        if (localTime > cloudTime) {
          await setDoc(doc(db, "projects", id), { ...localProj, userId });
          mergedProjects.push(localProj);
        } else {
          mergedProjects.push(cloudProj);
        }
      } else if (localProj) {
        await setDoc(doc(db, "projects", id), { ...localProj, userId });
        mergedProjects.push(localProj);
      } else if (cloudProj) {
        mergedProjects.push(cloudProj);
      }
    }

    // --- 2. CHAPTERS ---
    const chapSnap = await getDocs(query(collection(db, "chapters"), where("userId", "==", userId)));
    const cloudChaptersMap = new Map<string, Chapter>();
    chapSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...chapterData } = data;
      cloudChaptersMap.set(doc.id, { id: doc.id, ...chapterData } as Chapter);
    });

    const localChaptersStr = localStorage.getItem("novelforge_chapters");
    const localChapters: Chapter[] = localChaptersStr ? JSON.parse(localChaptersStr) : [];
    const localChaptersMap = new Map<string, Chapter>(localChapters.map(c => [c.id, c]));

    const allChapterIds = new Set([...cloudChaptersMap.keys(), ...localChaptersMap.keys()]);
    const mergedChapters: Chapter[] = [];

    for (const id of allChapterIds) {
      const localChap = localChaptersMap.get(id);
      const cloudChap = cloudChaptersMap.get(id);

      if (localChap && cloudChap) {
        const localTime = getTimestamp(localChap.updatedAt);
        const cloudTime = getTimestamp(cloudChap.updatedAt);
        if (localTime > cloudTime) {
          await setDoc(doc(db, "chapters", id), { ...localChap, userId });
          mergedChapters.push(localChap);
        } else {
          mergedChapters.push(cloudChap);
        }
      } else if (localChap) {
        await setDoc(doc(db, "chapters", id), { ...localChap, userId });
        mergedChapters.push(localChap);
      } else if (cloudChap) {
        mergedChapters.push(cloudChap);
      }
    }

    // --- 3. CHARACTERS ---
    const charSnap = await getDocs(query(collection(db, "characters"), where("userId", "==", userId)));
    const cloudCharactersMap = new Map<string, Character>();
    charSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...characterData } = data;
      cloudCharactersMap.set(doc.id, { id: doc.id, ...characterData } as Character);
    });

    const localCharactersStr = localStorage.getItem("novelforge_characters");
    const localCharacters: Character[] = localCharactersStr ? JSON.parse(localCharactersStr) : [];
    const localCharactersMap = new Map<string, Character>(localCharacters.map(c => [c.id, c]));

    const allCharacterIds = new Set([...cloudCharactersMap.keys(), ...localCharactersMap.keys()]);
    const mergedCharacters: Character[] = [];

    for (const id of allCharacterIds) {
      const localChar = localCharactersMap.get(id);
      const cloudChar = cloudCharactersMap.get(id);

      if (localChar && cloudChar) {
        const localTime = getTimestamp(localChar.updatedAt);
        const cloudTime = getTimestamp(cloudChar.updatedAt);
        if (localTime > cloudTime) {
          await setDoc(doc(db, "characters", id), { ...localChar, userId });
          mergedCharacters.push(localChar);
        } else {
          mergedCharacters.push(cloudChar);
        }
      } else if (localChar) {
        await setDoc(doc(db, "characters", id), { ...localChar, userId });
        mergedCharacters.push(localChar);
      } else if (cloudChar) {
        mergedCharacters.push(cloudChar);
      }
    }

    // --- 4. LOCATIONS ---
    const locSnap = await getDocs(query(collection(db, "locations"), where("userId", "==", userId)));
    const cloudLocationsMap = new Map<string, Location>();
    locSnap.forEach((doc) => {
      const data = doc.data();
      const { userId: _, ...locationData } = data;
      cloudLocationsMap.set(doc.id, { id: doc.id, ...locationData } as Location);
    });

    const localLocationsStr = localStorage.getItem("novelforge_locations");
    const localLocations: Location[] = localLocationsStr ? JSON.parse(localLocationsStr) : [];
    const localLocationsMap = new Map<string, Location>(localLocations.map(l => [l.id, l]));

    const allLocationIds = new Set([...cloudLocationsMap.keys(), ...localLocationsMap.keys()]);
    const mergedLocations: Location[] = [];

    for (const id of allLocationIds) {
      const localLoc = localLocationsMap.get(id);
      const cloudLoc = cloudLocationsMap.get(id);

      if (localLoc && cloudLoc) {
        const localTime = getTimestamp(localLoc.updatedAt);
        const cloudTime = getTimestamp(cloudLoc.updatedAt);
        if (localTime > cloudTime) {
          await setDoc(doc(db, "locations", id), { ...localLoc, userId });
          mergedLocations.push(localLoc);
        } else {
          mergedLocations.push(cloudLoc);
        }
      } else if (localLoc) {
        await setDoc(doc(db, "locations", id), { ...localLoc, userId });
        mergedLocations.push(localLoc);
      } else if (cloudLoc) {
        mergedLocations.push(cloudLoc);
      }
    }

    // Save back to local storage so Offline/Instant load works perfectly
    localStorage.setItem("novelforge_projects", JSON.stringify(mergedProjects));
    localStorage.setItem("novelforge_chapters", JSON.stringify(mergedChapters));
    localStorage.setItem("novelforge_characters", JSON.stringify(mergedCharacters));
    localStorage.setItem("novelforge_locations", JSON.stringify(mergedLocations));

    return { 
      projects: mergedProjects, 
      chapters: mergedChapters, 
      characters: mergedCharacters, 
      locations: mergedLocations 
    };
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
