import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import ReaderView from '../components/ReaderView';
import PDFViewer from '../components/PDFViewer';
import { ChevronLeft } from 'lucide-react';

export default function Home() {
  const { todayContent } = useAppContext();
  const [activeItem, setActiveItem] = useState(null);
  
  if (activeItem) {
    return (
      <div className="pb-20 pt-4 px-4 h-screen max-w-lg mx-auto bg-gray-50 flex flex-col">
        <button
          onClick={() => setActiveItem(null)}
          className="mb-4 text-blue-600 font-medium self-start hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={18} />
          عودة للبرنامج اليومي
        </button>
        <div className="flex-1 overflow-hidden">
          {activeItem.is_pdf ? (
            <PDFViewer title={activeItem.title} pdfUrl={activeItem.pdf_url} />
          ) : (
            <ReaderView
              title={activeItem.title}
              text={activeItem.text}
              itemId={activeItem.id}
              type={activeItem.type || 'weekly'}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-sans mb-2">أثر</h1>
        <p className="text-gray-500 font-medium">البرنامج المعرفي اليومي</p>
      </header>
      
      <div className="space-y-6">
        {/* Hijri Event Section */}
        {todayContent.events && todayContent.events.length > 0 && (
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-blue-600 mb-3 tracking-wider uppercase">مناسبة اليوم</h2>
            {todayContent.events.map(event => (
              <div key={event.id} className="mb-3 last:mb-0">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{event.day} {event.month}</h3>
                <p className="text-gray-700 leading-relaxed">{event.text}</p>
              </div>
            ))}
          </section>
        )}
        
        {/* Weekly Content Section */}
        {todayContent.weekly && todayContent.weekly.length > 0 && (
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-emerald-600 mb-3 tracking-wider uppercase">أعمال اليوم</h2>
            {todayContent.weekly.map(item => (
              <div key={item.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-gray-50">
                <h3 className="font-bold text-gray-900 mb-2">
                  {item.is_featured && <span className="inline-block bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full ml-2 align-middle">مميز</span>}
                  {item.title}
                </h3>
                {item.is_pdf ? (
                  <p className="text-gray-500 text-sm">{item.pdf_url ? 'ملف PDF' : 'ملف PDF غير متاح للفتح'}</p>
                ) : (
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{item.text}</p>
                )}
                <button 
                  onClick={() => setActiveItem(item)}
                  className="mt-3 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
                >
                  قراءة المزيد ←
                </button>
              </div>
            ))}
          </section>
        )}
        
        {/* Fallback Empty State */}
        {(!todayContent.events || todayContent.events.length === 0) && (!todayContent.weekly || todayContent.weekly.length === 0) && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 mb-2">لا توجد أعمال خاصة مبرمجة لهذا اليوم.</p>
            <p className="text-sm text-gray-400">يمكنك تصفح المكتبة أو الصلوات.</p>
          </div>
        )}
      </div>
    </div>
  );
}
