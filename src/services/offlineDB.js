import localforage from 'localforage';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const FAVORITES_KEY = 'favorites';
const PENDING_KEY = 'pendingFavoriteOperations';

localforage.config({
  name: 'athar_app',
  storeName: 'athar_data',
});

const readArray = async (key) => (await localforage.getItem(key)) || [];
const writeArray = (key, value) => localforage.setItem(key, value);
const itemId = (item) => String(item.id || item.content_id || '');
const itemType = (item) => item.type || item.content_type || 'unknown';
const favoriteKey = (item) => `${itemType(item)}:${itemId(item)}`;

export const getFavoritesLocal = async () => readArray(FAVORITES_KEY);
export const getPendingFavoriteOperations = async () => readArray(PENDING_KEY);

export const isFavoriteLocal = async (item) => {
  const key = favoriteKey(item);
  const favorites = await getFavoritesLocal();
  return favorites.some((favorite) => favoriteKey(favorite) === key);
};

export const saveFavoriteLocal = async (item) => {
  const favorites = await getFavoritesLocal();
  const key = favoriteKey(item);
  if (!favorites.some((favorite) => favoriteKey(favorite) === key)) {
    await writeArray(FAVORITES_KEY, [...favorites, item]);
  }
  return item;
};

export const removeFavoriteLocal = async (item) => {
  const key = favoriteKey(item);
  const favorites = await getFavoritesLocal();
  await writeArray(FAVORITES_KEY, favorites.filter((favorite) => favoriteKey(favorite) !== key));
};

const queueOperation = async ({ action, item, userId }) => {
  const queue = await getPendingFavoriteOperations();
  const key = favoriteKey(item);
  const next = queue.filter((entry) => (
    favoriteKey(entry.item) !== key || entry.userId !== userId
  ));
  await writeArray(PENDING_KEY, [...next, { action, item, userId, queuedAt: Date.now() }]);
};

/** Bind operations created while offline and unauthenticated to the next anonymous user. */
export const bindAnonymousOperations = async (userId) => {
  if (!userId) return;
  const queue = await getPendingFavoriteOperations();
  const changed = queue.map((entry) => entry.userId ? entry : { ...entry, userId });
  await writeArray(PENDING_KEY, changed);
};

export const saveFavorite = async (item, userId) => {
  await saveFavoriteLocal(item);
  await queueOperation({ action: 'upsert', item, userId: userId || null });
  if (userId) void syncFavorites(userId);
  return item;
};

export const removeFavorite = async (item, userId) => {
  await removeFavoriteLocal(item);
  await queueOperation({ action: 'delete', item, userId: userId || null });
  if (userId) void syncFavorites(userId);
};

const toRemoteRow = (operation) => ({
  user_id: operation.userId,
  content_type: itemType(operation.item),
  content_id: itemId(operation.item),
  title: operation.item.title || '',
});

const removeQueueEntry = async (operation) => {
  const queue = await getPendingFavoriteOperations();
  const key = favoriteKey(operation.item);
  await writeArray(PENDING_KEY, queue.filter((entry) => (
    favoriteKey(entry.item) !== key || entry.userId !== operation.userId
  )));
};

export const syncFavorites = async (userId) => {
  if (!userId || !navigator.onLine || !supabase || !isSupabaseConfigured) {
    return { synced: 0, pending: true };
  }

  const queue = (await getPendingFavoriteOperations()).filter((operation) => operation.userId === userId);
  let synced = 0;

  for (const operation of queue) {
    try {
      const row = toRemoteRow(operation);
      let error;

      if (operation.action === 'upsert') {
        ({ error } = await supabase
          .from('favorites')
          .upsert(row, {
            onConflict: 'user_id,content_type,content_id',
            ignoreDuplicates: true,
          }));
      } else {
        ({ error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', row.user_id)
          .eq('content_type', row.content_type)
          .eq('content_id', row.content_id));
      }

      if (error) throw error;
      await removeQueueEntry(operation);
      synced += 1;
    } catch (error) {
      // Never remove a failed operation. It will be retried on the next online event.
      console.warn('Favorite sync failed; operation remains queued.', error);
      break;
    }
  }

  return { synced, pending: (await getPendingFavoriteOperations()).length > 0 };
};

export const mergeRemoteFavorites = async (remoteFavorites) => {
  const localFavorites = await getFavoritesLocal();
  const queue = await getPendingFavoriteOperations();
  const pendingDeletes = new Set(
    queue.filter((operation) => operation.action === 'delete').map((operation) => favoriteKey(operation.item)),
  );
  const byKey = new Map(localFavorites.map((item) => [favoriteKey(item), item]));

  for (const item of remoteFavorites || []) {
    if (!pendingDeletes.has(favoriteKey(item))) byKey.set(favoriteKey(item), item);
  }

  const merged = [...byKey.values()];
  await writeArray(FAVORITES_KEY, merged);
  return merged;
};

export const attachSyncListeners = (userId) => {
  const handleOnline = () => void syncFavorites(userId);
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
};
