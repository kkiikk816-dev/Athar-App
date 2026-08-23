import React from 'react';
import { FileText } from 'lucide-react';

export default function PDFViewer({ title, pdfUrl }) {
  const hasUrl = Boolean(pdfUrl);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
        <FileText size={32} />
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title || 'ملف PDF'}</h3>
      {hasUrl ? (
        <>
          <p className="text-sm text-gray-500 max-w-xs">هذا المحتوى متاح كملف PDF.</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
          >
            <FileText size={18} />
            <span>قراءة الملف</span>
          </a>
        </>
      ) : (
        <p className="text-sm text-gray-500 max-w-xs">لا يوجد رابط قراءة لهذا الملف في مصدر البيانات الحالي.</p>
      )}
    </div>
  );
}
