import React, { createContext, useContext, useState, useEffect } from 'react';
import taqibatData from '../data/taqibat.json';
import hijriEventsData from '../data/hijri_events.json';
import weeklyData from '../data/weekly.json';
import { getCurrentHijriDateStr, getCurrentWeekday } from '../utils/dateSync';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [todayContent, setTodayContent] = useState({});

  useEffect(() => {
    // getTodayContent logic
    const hijriDateStr = getCurrentHijriDateStr();
    const weekday = getCurrentWeekday();
    
    const todayEvents = hijriEventsData.filter(e => e.hijri_date === hijriDateStr);
    const todayWeekly = weeklyData.filter(w => w.weekday === weekday);
    
    setTodayContent({
      events: todayEvents,
      weekly: todayWeekly,
      taqibat: taqibatData
    });
  }, []);

  return (
    <AppContext.Provider value={{ todayContent, taqibatData, hijriEventsData, weeklyData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
