import React, { useEffect, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRemoteFavorites } from '../repositories/contentRepository';
import {
  getFavoritesLocal,
  mergeRemoteFavorites,
  removeFavorite,
} from '../services/offlineDB';

const typeLabel = (type) => ({
  taqibat: 'تعقيبات',
  weekly: 'أعمال الأسبوع',
  dua: 'أدعية',
  ziyara: 'زيارات',
  munajat: 'مناجاة',
  pdf: 'ملفات',
  hadith: 'أحاديث',
  wisdom: 'حِكَم',
}[type] || 'محتوى');

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadFavorites = async () => {
      const local = await getFavoritesLocal();
      if (mounted) setFavorites(local);

      if (!user?.id || !navigator.onLine) return;
      try {
        const remote = await fetchRemoteFavorites(user.id);
        const merged = await mergeRemoteFavorites(remote);
        if (mounted) setFavorites(merged);
      } catch (error) {
        console.warn('Could not load remote favorites; keeping local favorites.', error);
      }
    };

    void loadFavorites();
    return () => { mounted = false; };
  }, [user?.id]);

  const removeFavoriteFromList = async (item) => {
    await removeFavorite(item, user?.id);
    const local = await getFavoritesLocal();
    setFavorites(local);
  };

  return (
    <div className="pb-20 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">المفضلات</h1>
        <p className="text-gray-500 text-sm">المحتوى المحفوظ للوصول السريع</p>
      </header>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
          <Heart size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">لا توجد عناصر في المفضلة</p>
          <p className="text-sm text-gray-400 mt-2">أضف الأدعية والزيارات والمحتوى الذي تريد الوصول إليه لاحقًا</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => (
            <div key={`${item.type || item.content_type}:${item.id || item.content_id}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{item.title || 'بدون عنوان'}</h3>
                <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {typeLabel(item.type || item.content_type)}
                </span>
              </div>
              <button
                onClick={() => void removeFavoriteFromList(item)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Remove from favorites"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
