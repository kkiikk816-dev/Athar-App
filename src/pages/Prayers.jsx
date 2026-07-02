import React, { useState, useEffect } from 'react';
import { calculatePrayerTimes } from '../services/prayerCalc';
import { useAppContext } from '../contexts/AppContext';
import ReaderView from '../components/ReaderView';
import { Clock } from 'lucide-react';

export default function Prayers() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [activeTaqibat, setActiveTaqibat] = useState(null);
  const { taqibatData } = useAppContext();

  useEffect(() => {
    // Default to Baghdad coordinates if geolocation is not available
    const getTimes = (lat = 33.3152, lng = 44.3661) => {
      const times = calculatePrayerTimes(lat, lng);
      setPrayerTimes(times);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getTimes(pos.coords.latitude, pos.coords.longitude),
        () => getTimes()
      );
    } else {
      getTimes();
    }
  }, []);

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const prayersList = [
    { id: 'fajr', label: 'الفجر', key: 'fajr' },
    { id: 'dhuhr', label: 'الظهر', key: 'dhuhr' },
    { id: 'asr', label: 'العصر', key: 'asr' },
    { id: 'maghrib', label: 'المغرب', key: 'maghrib' },
    { id: 'isha', label: 'العشاء', key: 'isha' },
  ];

  if (activeTaqibat) {
    return (
      <div className="pb-20 pt-4 px-4 h-screen max-w-lg mx-auto bg-gray-50 flex flex-col">
        <button 
          onClick={() => setActiveTaqibat(null)}
          className="mb-4 text-blue-600 font-medium self-start hover:text-blue-800 transition-colors"
        >
          ← عودة
        </button>
        <div className="flex-1 overflow-hidden">
          <ReaderView 
            title={activeTaqibat.title} 
            text={activeTaqibat.text} 
            itemId={activeTaqibat.id}
            type="taqibat"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">مواقيت الصلاة</h1>
        <p className="text-gray-500 text-sm">بغداد (أو حسب موقعك)</p>
      </header>

      <div className="space-y-4">
        {prayersList.map((prayer) => {
          const time = prayerTimes ? formatTime(prayerTimes[prayer.key]) : '--:--';
          const taqibatForPrayer = taqibatData?.filter(t => t.prayer === prayer.id) || [];
          
          return (
            <div key={prayer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Clock size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900">{prayer.label}</h3>
                </div>
                <div className="text-xl font-mono text-gray-700 tracking-tight" dir="ltr">{time}</div>
              </div>
              
              {taqibatForPrayer.length > 0 && (
                <div className="p-3 bg-white">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">التعقيبات</p>
                  <div className="flex flex-wrap gap-2">
                    {taqibatForPrayer.map(taq => (
                      <button
                        key={taq.id}
                        onClick={() => setActiveTaqibat(taq)}
                        className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                      >
                        {taq.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
