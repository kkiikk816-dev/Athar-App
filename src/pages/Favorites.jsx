import React, { useState, useEffect } from 'react';
import { getFavoritesLocal } from '../services/offlineDB';
import { Heart, Trash2 } from 'lucide-react';
import localforage from 'localforage';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const favs = await getFavoritesLocal();
    setFavorites(favs || []);
  };

  const removeFavorite = async (id) => {
    const current = await getFavoritesLocal();
    const updated = current.filter(item => item.id !== id);
    await localforage.setItem('favorites', updated);
    setFavorites(updated);
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
          <p className="text-sm text-gray-400 mt-2">قم بإضافة الأدعية والزيارات لمفضلتك للوصول إليها لاحقاً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{item.title || 'بدون عنوان'}</h3>
                <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {item.type === 'taqibat' ? 'تعقيبات' : 'مكتبة'}
                </span>
              </div>
              <button 
                onClick={() => removeFavorite(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
