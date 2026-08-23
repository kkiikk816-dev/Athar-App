import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import taqibatData from '../data/taqibat.json';
import hijriEventsData from '../data/hijri_events.json';
import weeklyData from '../data/weekly.json';
import { getCurrentHijriDateStr, getCurrentWeekday } from '../utils/dateSync';
import { fetchTodayContent } from '../repositories/contentRepository';

const getLocalTodayContent = () => {
  const hijriDate = getCurrentHijriDateStr();
  const weekday = getCurrentWeekday();
  return {
    events: hijriEventsData.filter((event) => event.hijri_date === hijriDate),
    weekly: weeklyData.filter((item) => item.weekday === weekday),
    taqibat: taqibatData,
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

    const syncTodayContent = async () => {
      setCloudSyncing(true);
      try {
        const remote = await fetchTodayContent({ hijriDate, weekday });
        if (!mounted) return;

        setTodayContent((local) => ({
          events: remote.events?.length ? remote.events : local.events,
          weekly: remote.weekly?.length ? remote.weekly : local.weekly,
          taqibat: remote.taqibat?.length ? remote.taqibat : local.taqibat,
        }));
      } catch (error) {
        // Local JSON remains the source of truth when the request fails.
        console.warn('Background content sync failed; keeping local data.', error);
      } finally {
        if (mounted) setCloudSyncing(false);
      }
    };

    // This starts after the first render; it can never block local content.
    void syncTodayContent();
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
