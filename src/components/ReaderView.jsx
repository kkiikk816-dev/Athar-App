import React, { useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Moon, Sun, Heart } from 'lucide-react';
import { isFavoriteLocal, removeFavorite, saveFavorite } from '../services/offlineDB';
import { useAuth } from '../contexts/AuthContext';

export default function ReaderView({ title, text, itemId, type = 'text' }) {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('reader_font_size');
    return saved ? parseInt(saved, 10) : 18;
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('reader_dark_mode') === 'true');
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const favorite = { id: itemId, type, title };

  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_dark_mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    let mounted = true;
    if (itemId) {
      void isFavoriteLocal(favorite).then((value) => {
        if (mounted) setIsFavorite(value);
      });
    }
    return () => { mounted = false; };
  }, [itemId, type]);

  const increaseFont = () => setFontSize((prev) => Math.min(prev + 2, 40));
  const decreaseFont = () => setFontSize((prev) => Math.max(prev - 2, 12));
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleFavorite = async () => {
    try {
      if (isFavorite) await removeFavorite(favorite, user?.id);
      else await saveFavorite(favorite, user?.id);
      setIsFavorite((prev) => !prev);
    } catch (error) {
      console.error('Failed to update favorite locally', error);
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-[50vh] rounded-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900 shadow-sm border border-gray-100'}`}>
      <div className={`flex items-center justify-between p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <h3 className="font-medium truncate flex-1">{title}</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button onClick={decreaseFont} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors" aria-label="Decrease font size"><ZoomOut size={18} /></button>
          <button onClick={increaseFont} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors" aria-label="Increase font size"><ZoomIn size={18} /></button>
          <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors" aria-label="Toggle dark mode">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {itemId && (
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
            </button>
          )}
        </div>
      </div>
      <div className="p-6 overflow-y-auto leading-relaxed" style={{ fontSize: `${fontSize}px` }} dir="rtl">
        {text ? text.split('\n').map((paragraph, index) => <p key={index} className="mb-4">{paragraph}</p>) : <p className="text-gray-500 italic">لا يوجد محتوى</p>}
      </div>
    </div>
  );
}
