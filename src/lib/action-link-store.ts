const STORAGE_KEY = 'shelfy-action-link';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function createFallbackStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

const fallbackStorage = createFallbackStorage();

function getStorage(): StorageLike {
  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    return window.sessionStorage;
  }
  return fallbackStorage;
}

export const actionLinkStore = {
  setPendingLink(target: string | null | undefined) {
    if (!target) {
      return;
    }
    getStorage().setItem(STORAGE_KEY, target);
  },
  getPendingLink() {
    return getStorage().getItem(STORAGE_KEY);
  },
  clearPendingLink() {
    getStorage().removeItem(STORAGE_KEY);
  },
  consumePendingLink() {
    const pending = getStorage().getItem(STORAGE_KEY);
    if (pending) {
      getStorage().removeItem(STORAGE_KEY);
    }
    return pending;
  },
};

export const actionLinkStoreTestUtils = {
  reset() {
    fallbackStorage.clear();
  },
};
