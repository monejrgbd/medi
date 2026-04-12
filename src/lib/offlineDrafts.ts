const DB_NAME = "hilt_drafts";
const STORE_NAME = "document_drafts";
const DB_VERSION = 1;

interface DraftEntry {
  contentBody: string;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(
  documentId: string,
  contentBody: string
): Promise<void> {
  try {
    if (typeof indexedDB === "undefined") return;
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const entry: DraftEntry = { contentBody, savedAt: Date.now() };
    store.put(entry, documentId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB unavailable (SSR, private browsing) — silently fail
  }
}

export async function loadDraft(
  documentId: string
): Promise<{ contentBody: string; savedAt: number } | null> {
  try {
    if (typeof indexedDB === "undefined") return null;
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(documentId);
    const result = await new Promise<DraftEntry | undefined>(
      (resolve, reject) => {
        request.onsuccess = () => resolve(request.result as DraftEntry | undefined);
        request.onerror = () => reject(request.error);
      }
    );
    db.close();
    if (!result) return null;
    return { contentBody: result.contentBody, savedAt: result.savedAt };
  } catch {
    return null;
  }
}

export async function clearDraft(documentId: string): Promise<void> {
  try {
    if (typeof indexedDB === "undefined") return;
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(documentId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Silently fail
  }
}
