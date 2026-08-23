import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { ensureUserRecord, fetchRemoteFavorites } from '../repositories/contentRepository';
import {
  attachSyncListeners,
  bindAnonymousOperations,
  mergeRemoteFavorites,
  syncFavorites,
} from '../services/offlineDB';

const AuthContext = createContext({ user: null, loading: false });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const startingAnonymousSession = useRef(false);

  useEffect(() => {
    let mounted = true;

    const setCurrentUser = (nextUser) => {
      if (!mounted) return;
      setUser(nextUser || null);
      if (nextUser) void ensureUserRecord(nextUser);
    };

    const ensureAnonymousSession = async () => {
      if (!mounted || !supabase || !isSupabaseConfigured) return;
      if (startingAnonymousSession.current) return;

      startingAnonymousSession.current = true;
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (sessionData.session?.user) {
          setCurrentUser(sessionData.session.user);
          return;
        }

        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        setCurrentUser(data.user);
      } catch (error) {
        console.warn('Anonymous authentication unavailable; continuing locally.', error);
      } finally {
        startingAnonymousSession.current = false;
      }
    };

    const hydrateStoredSession = async () => {
      if (!supabase || !isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session?.user) setCurrentUser(data.session.user);
        else void ensureAnonymousSession();
      } catch (error) {
        console.warn('Stored Supabase session unavailable; continuing locally.', error);
      }
    };

    const handleOnline = () => void ensureAnonymousSession();

    // No auth request is awaited before the first render.
    setLoading(false);
    void hydrateStoredSession();
    window.addEventListener('online', handleOnline);

    let subscription;
    if (supabase && isSupabaseConfigured) {
      const authState = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
      });
      subscription = authState.data.subscription;
    }

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;

    const syncUserData = async () => {
      await bindAnonymousOperations(user.id);
      await syncFavorites(user.id);
      if (!navigator.onLine || !supabase || !isSupabaseConfigured) return;

      try {
        const remoteFavorites = await fetchRemoteFavorites(user.id);
        if (mounted) await mergeRemoteFavorites(remoteFavorites);
      } catch (error) {
        console.warn('Remote favorites unavailable; local favorites remain active.', error);
      }
    };

    void syncUserData();
    const detachOnlineListener = attachSyncListeners(user.id);
    return () => {
      mounted = false;
      detachOnlineListener();
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
