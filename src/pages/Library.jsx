import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import ReaderView from '../components/ReaderView';
import PDFViewer from '../components/PDFViewer';
import { Book, FileText, ChevronLeft } from 'lucide-react';

export default function Library() {
  const { weeklyData } = useAppContext();
  const [activeItem, setActiveItem] = useState(null);

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
            <PDFViewer 
              title={activeItem.title} 
              fileId={activeItem.file_id} 
              pdfUrl={activeItem.pdf_url} 
            />
          ) : (
            <ReaderView 
              title={activeItem.title} 
              text={activeItem.text} 
              itemId={activeItem.id}
              type="library"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">المكتبة العبادية</h1>
        <p className="text-gray-500 text-sm">أدعية، زيارات، ومناجاة</p>
      </header>

      <div className="space-y-3">
        {weeklyData?.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item)}
            className="w-full text-right bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.is_pdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                {item.is_pdf ? <FileText size={20} /> : <Book size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.is_pdf ? 'ملف PDF' : 'نص مقروء'}</p>
              </div>
            </div>
            <ChevronLeft size={20} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
