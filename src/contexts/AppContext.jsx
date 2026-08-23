import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  cloudSyncing: false,
});

export const AppProvider = ({ children }) => {
  const [todayContent, setTodayContent] = useState(getLocalTodayContent);
  const [cloudSyncing, setCloudSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hijriDate = getCurrentHijriDateStr();
    const weekday = getCurrentWeekday();
    const cacheKey = `today_${hijriDate}_${weekday}`;

    const loadCachedAndSync = async () => {
      try {
        const cached = await getCachedContent(cacheKey);
        if (mounted && cached) {
          setTodayContent((local) => ({
            events: cached.events?.length ? cached.events : local.events,
            weekly: cached.weekly?.length ? cached.weekly : local.weekly,
            taqibat: cached.taqibat?.length ? cached.taqibat : local.taqibat,
          }));
        }
      } catch (e) {
        console.warn('Cache read failed', e);
      }

      setCloudSyncing(true);
      try {
        const remote = await fetchTodayContent({ hijriDate, weekday });
        if (!mounted) return;

        const updated = {
          events: remote.events?.length ? remote.events : todayContent.events,
          weekly: remote.weekly?.length ? remote.weekly : todayContent.weekly,
          taqibat: remote.taqibat?.length ? remote.taqibat : todayContent.taqibat,
        };

        setTodayContent(updated);
        await setCachedContent(cacheKey, updated);
      } catch (error) {
        console.warn('Background content sync failed; keeping local/cached data.', error);
      } finally {
        if (mounted) setCloudSyncing(false);
      }
    };

    void loadCachedAndSync();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({
    todayContent,
    taqibatData,
    hijriEventsData,
    weeklyData,
    cloudSyncing,
  }), [todayContent, cloudSyncing]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
