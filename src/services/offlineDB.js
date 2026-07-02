import localforage from 'localforage';
import { supabase } from './supabaseClient';

localforage.config({
  name: 'athar_app',
  storeName: 'favorites'
});

export const saveFavoriteLocal = async (item) => {
  const favorites = await localforage.getItem('favorites') || [];
  favorites.push(item);
  await localforage.setItem('favorites', favorites);
};

export const getFavoritesLocal = async () => {
  return await localforage.getItem('favorites') || [];
};

export const syncFavorites = async (userId) => {
  if (!navigator.onLine) return;
  const localFavorites = await getFavoritesLocal();
  if (localFavorites.length === 0) return;
  
  // Sync logic here
  for (const item of localFavorites) {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        content_type: item.type,
        content_id: item.id,
        title: item.title || ''
      });
      
    if (!error) {
      // remove from local after sync, or keep them marked as synced
    }
  }
};
