import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { fetchLibraryContent, fetchHadiths, fetchWisdoms } from '../repositories/contentRepository';
import { getCachedContent, setCachedContent } from '../services/contentCache';
import ReaderView from '../components/ReaderView';
import PDFViewer from '../components/PDFViewer';
import { Book, FileText, ChevronLeft, MessageCircle, Lightbulb, Search, Loader2 } from 'lucide-react';

export default function Library() {
  const { weeklyData } = useAppContext();
  const [libraryItems, setLibraryItems] = useState(weeklyData || []);
  const [activeItem, setActiveItem] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'hadiths', 'wisdoms'
  
  // Pagination and state for Hadiths & Wisdoms
  const [hadiths, setHadiths] = useState([]);
  const [wisdoms, setWisdoms] = useState([]);
  const [hadithsPage, setHadithsPage] = useState(0);
  const [wisdomsPage, setWisdomsPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreHadiths, setHasMoreHadiths] = useState(true);
  const [hasMoreWisdoms, setHasMoreWisdoms] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const cacheKey = 'library_content_full';

    const loadLibrary = async () => {
      try {
        const cached = await getCachedContent(cacheKey);
        if (mounted && cached && cached.length > 0) setLibraryItems(cached);
      } catch (e) {
        console.warn('Library cache read failed', e);
      }

      if (!navigator.onLine) return;
      try {
        const remoteItems = await fetchLibraryContent();
        if (!mounted) return;
        
        if (remoteItems.length > 0) {
          setLibraryItems(remoteItems);
          await setCachedContent(cacheKey, remoteItems);
        }
      } catch (error) {
        console.warn('Library sync failed; keeping local/cached data.', error);
      }
    };
    void loadLibrary();
    return () => { mounted = false; };
  }, []);

  const loadMoreHadiths = async () => {
    if (isLoadingMore || !hasMoreHadiths || !navigator.onLine) return;
    setIsLoadingMore(true);
    try {
      const newItems = await fetchHadiths(hadithsPage, 20);
      if (newItems.length < 20) setHasMoreHadiths(false);
      setHadiths(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const filtered = newItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...filtered];
      });
      setHadithsPage(prev => prev + 1);
    } catch (e) {
      console.warn('Failed to load hadiths', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreWisdoms = async () => {
    if (isLoadingMore || !hasMoreWisdoms || !navigator.onLine) return;
    setIsLoadingMore(true);
    try {
      const newItems = await fetchWisdoms(wisdomsPage, 20);
      if (newItems.length < 20) setHasMoreWisdoms(false);
      setWisdoms(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const filtered = newItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...filtered];
      });
      setWisdomsPage(prev => prev + 1);
    } catch (e) {
      console.warn('Failed to load wisdoms', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'hadiths' && hadiths.length === 0) loadMoreHadiths();
    if (activeTab === 'wisdoms' && wisdoms.length === 0) loadMoreWisdoms();
  }, [activeTab]);

  if (activeItem) {
    return (
      <div className="pb-20 pt-4 px-4 h-screen max-w-lg mx-auto bg-gray-50 flex flex-col">
        <button
          onClick={() => setActiveItem(null)}
          className="mb-4 text-blue-600 font-medium self-start hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={18} />
          عودة للمكتبة
        </button>
        <div className="flex-1 overflow-hidden">
          {activeItem.is_pdf ? (
            <PDFViewer title={activeItem.title} pdfUrl={activeItem.pdf_url} />
          ) : (
            <ReaderView
              title={activeItem.title}
              text={activeItem.text}
              itemId={activeItem.id}
              type={activeItem.type || 'library'}
            />
          )}
        </div>
      </div>
    );
  }

  const getActiveItems = () => {
    let items = [];
    if (activeTab === 'library') items = libraryItems;
    if (activeTab === 'hadiths') items = hadiths;
    if (activeTab === 'wisdoms') items = wisdoms;

    if (searchQuery) {
      items = items.filter(item => 
        (item.title && item.title.includes(searchQuery)) || 
        (item.text && item.text.includes(searchQuery))
      );
    }
    return items;
  };

  const activeItems = getActiveItems();

  return (
    <div className="pb-20 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">المكتبة العبادية</h1>
        <p className="text-gray-500 text-sm">أدعية، زيارات، أحاديث وحِكم</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm border border-gray-100">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'library' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          المكتبة
        </button>
        <button
          onClick={() => setActiveTab('hadiths')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'hadiths' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          الأحاديث
        </button>
        <button
          onClick={() => setActiveTab('wisdoms')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'wisdoms' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          الحِكم
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث في المحتوى..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pr-10 pl-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
        />
      </div>

      <div className="space-y-3">
        {activeItems.length === 0 && !isLoadingMore ? (
          <div className="text-center py-10 text-gray-500">لا توجد نتائج مطابقة</div>
        ) : (
          activeItems.map((item) => (
            <button
              key={`${item.type || 'weekly'}-${item.id}`}
              onClick={() => setActiveItem(item)}
              className="w-full text-right bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
                  item.is_pdf ? 'bg-red-50 text-red-500' : 
                  activeTab === 'hadiths' ? 'bg-emerald-50 text-emerald-500' :
                  activeTab === 'wisdoms' ? 'bg-amber-50 text-amber-500' :
                  'bg-blue-50 text-blue-500'
                }`}>
                  {item.is_pdf ? <FileText size={20} /> : 
                   activeTab === 'hadiths' ? <MessageCircle size={20} /> :
                   activeTab === 'wisdoms' ? <Lightbulb size={20} /> :
                   <Book size={20} />}
                </div>
                <div className="truncate text-right">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{item.title || 'بدون عنوان'}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {item.is_pdf ? (item.pdf_url ? 'ملف PDF' : 'ملف PDF غير متاح للفتح') : 
                     (item.text ? item.text.substring(0, 50) + '...' : 'نص مقروء')}
                  </p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
            </button>
          ))
        )}

        {/* Load More Button for Pagination */}
        {activeTab === 'hadiths' && hasMoreHadiths && !searchQuery && (
          <button 
            onClick={loadMoreHadiths}
            disabled={isLoadingMore}
            className="w-full py-3 mt-4 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : 'عرض المزيد من الأحاديث'}
          </button>
        )}
        {activeTab === 'wisdoms' && hasMoreWisdoms && !searchQuery && (
          <button 
            onClick={loadMoreWisdoms}
            disabled={isLoadingMore}
            className="w-full py-3 mt-4 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : 'عرض المزيد من الحِكم'}
          </button>
        )}
      </div>
    </div>
  );
}
