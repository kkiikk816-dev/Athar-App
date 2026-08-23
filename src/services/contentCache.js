import localforage from 'localforage';

const cacheStore = localforage.createInstance({
  name: 'athar_app',
  storeName: 'remote_content_cache',
});

/**
 * Reads cached content for a specific query key.
 */
export const getCachedContent = async (key) => {
  try {
    return await cacheStore.getItem(key);
  } catch (error) {
    console.warn(`Failed to read cache for ${key}:`, error);
    return null;
  }
};

/**
 * Saves remote content to the local cache.
 */
export const setCachedContent = async (key, data) => {
  if (!data) return;
  try {
    await cacheStore.setItem(key, data);
  } catch (error) {
    console.warn(`Failed to write cache for ${key}:`, error);
  }
};
