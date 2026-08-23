import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Info } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="pb-20 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">الإعدادات</h1>
        <p className="text-gray-500 text-sm">تخصيص تجربتك وحسابك</p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <User size={24} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">حسابك</h2>
              <p className="text-sm text-gray-500">
                {user?.is_anonymous ? 'مستخدم زائر (مؤقت)' : 'حساب متصل'}
              </p>
            </div>
          </div>
          
          {/* قسم ربط تيليغرام تمت إزالته */}
        </section>

        {/* Notifications Section */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">الإشعارات</h3>
                <p className="text-xs text-gray-500">استلام التنبيهات المهمة</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-blue-500">
              <Info size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">حول تطبيق أثر</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                تطبيق هجين صُمم ليعمل بكفاءة عالية حتى بدون اتصال بالإنترنت. 
                جميع البيانات الأساسية متوفرة محلياً لضمان السرعة.
              </p>
              <p className="text-xs text-gray-400 mt-3" dir="ltr">v1.0.0</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
