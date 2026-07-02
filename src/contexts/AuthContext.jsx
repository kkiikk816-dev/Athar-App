import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Sign in anonymously if no session exists
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!error) {
          setUser(data.user);
        }
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Placeholder function for linking a Telegram account
  const linkTelegramAccount = async (telegramUserId) => {
    try {
      console.log(`Linking Telegram account ${telegramUserId} to user ${user?.id}`);
      // In a real application, you might call a Supabase Edge Function to securely
      // perform this action and update the 'users' table or identity link.
      // e.g., await supabase.functions.invoke('link-telegram', { body: { telegram_id: telegramUserId }});
      
      return { success: true, message: 'تم ربط الحساب بنجاح (وظيفة تجريبية)' };
    } catch (error) {
      console.error('Error linking Telegram account:', error);
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, linkTelegramAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
