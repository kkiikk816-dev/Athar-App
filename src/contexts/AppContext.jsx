import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import taqibatData from '../data/taqibat.json';
import hijriEventsData from '../data/hijri_events.json';
import weeklyData from '../data/weekly.json';
import { getCurrentHijriDateStr, getCurrentWeekday } from '../utils/dateSync';
import { fetchTodayContent } from '../repositories/contentRepository';

import { getCachedContent, setCachedContent } from '../services/contentCache';

const getLocalTodayContent = () => {
  const hijriDate = getCurrentHijriDateStr();
  const weekday = getCurrentWeekday();
  const localWeekly = weeklyData.filter((item) => item.weekday === weekday).map(item => ({...item, type: 'weekly'}));
  return {
    events: hijriEventsData.filter((event) => event.hijri_date === hijriDate),
    weekly: localWeekly,
    taqibat: taqibatData.map(item => ({...item, type: 'taqibat'})),
  };
};

const AppContext = createContext({
  todayContent: getLocalTodayContent(),
  taqibatData,
  hijriEventsData,
  weeklyData,
  isAppReady: false,
  isOnlineMode: false,
});

export const AppProvider = ({ children }) => {
  const [todayContent, setTodayContent] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hijriDate = getCurrentHijriDateStr();
    const weekday = getCurrentWeekday();
    const cacheKey = `today_${hijriDate}_${weekday}`;

    const initializeApp = async () => {
      let remoteData = null;
      let isConnected = false;

      // 1. Try to fetch from Supabase (Online Check)
      try {
        const remote = await fetchTodayContent({ hijriDate, weekday });
        if (remote && (remote.events?.length > 0 || remote.weekly?.length > 0 || remote.taqibat?.length > 0)) {
          remoteData = remote;
          isConnected = true;
        }
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to offline mode.', error);
      }

      if (!mounted) return;

      if (isConnected && remoteData) {
        // Online Mode: Use remote data and save to cache
        setTodayContent(remoteData);
        setIsOnlineMode(true);
        setCachedContent(cacheKey, remoteData).catch(e => console.warn('Cache write failed', e));
      } else {
        // Offline Mode: Try Cache first, then JSON
        setIsOnlineMode(false);
        try {
          const cached = await getCachedContent(cacheKey);
          if (cached && (cached.events?.length > 0 || cached.weekly?.length > 0 || cached.taqibat?.length > 0)) {
            setTodayContent(cached);
          } else {
            setTodayContent(getLocalTodayContent());
          }
        } catch (e) {
          console.warn('Cache read failed, using JSON fallback', e);
          setTodayContent(getLocalTodayContent());
        }
      }
      
      setIsAppReady(true);
    };

    void initializeApp();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({
    todayContent: todayContent || getLocalTodayContent(),
    taqibatData,
    hijriEventsData,
    weeklyData,
    isAppReady,
    isOnlineMode,
  }), [todayContent, isAppReady, isOnlineMode]);

  if (!isAppReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-600" dir="rtl">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-medium">جاري إعداد البرنامج اليومي...</p>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
