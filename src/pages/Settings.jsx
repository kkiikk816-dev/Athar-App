import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Info, RefreshCw, Server, CheckCircle, XCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [dbStatus, setDbStatus] = useState('checking'); // checking, connected, error, unconfigured
  const checkConnection = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setDbStatus('unconfigured');
      return;
    }
    setDbStatus('checking');
    try {
      const { error } = await supabase.from('hijri_events').select('id').limit(1);
      if (error) throw error;
      setDbStatus('connected');
    } catch (err) {
      console.error('Connection check failed:', err);
      setDbStatus('error');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);



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

        {/* Database Connection Section */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Server size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">حالة الخادم</h3>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {dbStatus === 'checking' && <span className="text-gray-500 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> جاري التحقق...</span>}
                  {dbStatus === 'connected' && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> متصل بنجاح</span>}
                  {dbStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><XCircle size={12} /> خطأ في الاتصال</span>}
                  {dbStatus === 'unconfigured' && <span className="text-amber-500 flex items-center gap-1"><Info size={12} /> غير مكوّن (يعمل محلياً)</span>}
                </div>
              </div>
            </div>
            <button 
              onClick={checkConnection}
              disabled={dbStatus === 'checking'}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50"
            >
              <RefreshCw size={18} className={dbStatus === 'checking' ? 'animate-spin' : ''} />
            </button>
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
