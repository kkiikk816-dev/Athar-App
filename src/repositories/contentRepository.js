import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const read = async (query) => {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Reads only the tables needed for the Home and Prayers screens.
 * A failed table must not prevent local fallback data from rendering.
 */
export const fetchTodayContent = async ({ hijriDate, weekday }) => {
  if (!isSupabaseConfigured || !supabase) return {};

  const results = await Promise.allSettled([
    read(supabase.from('hijri_events').select('*').eq('hijri_date', hijriDate)),
    read(supabase.from('weekly_content').select('*').eq('weekday', weekday)),
    read(supabase.from('taqibat').select('*')),
  ]);

  const [eventsResult, weeklyResult, taqibatResult] = results;
  return {
    events: eventsResult.status === 'fulfilled' ? eventsResult.value : null,
    weekly: weeklyResult.status === 'fulfilled' ? weeklyResult.value : null,
    taqibat: taqibatResult.status === 'fulfilled' ? taqibatResult.value : null,
  };
};

const normalizeLibraryItem = (item, type) => ({
  ...item,
  type,
  content_type: type,
  content_id: String(item.id),
});

/**
 * Loads the Library screen data on demand instead of downloading every table at boot.
 * The result is normalized to the shape consumed by Library.jsx and ReaderView.jsx.
 */
export const fetchLibraryContent = async () => {
  if (!isSupabaseConfigured || !supabase) return [];

  const results = await Promise.allSettled([
    read(supabase.from('weekly_content').select('*')),
    read(supabase.from('weekly_duas').select('*')),
    read(supabase.from('weekly_ziyarat').select('*')),
    read(supabase.from('munajat').select('*')),
    read(supabase.from('pdf_library').select('*')),
  ]);

  const [weekly, duas, ziyaret, munajat, pdfs] = results;
  const rows = [];

  if (weekly.status === 'fulfilled') rows.push(...weekly.value.map((item) => normalizeLibraryItem(item, 'weekly')));
  if (duas.status === 'fulfilled') rows.push(...duas.value.map((item) => normalizeLibraryItem(item, 'dua')));
  if (ziyaret.status === 'fulfilled') rows.push(...ziyaret.value.map((item) => normalizeLibraryItem(item, 'ziyara')));
  if (munajat.status === 'fulfilled') rows.push(...munajat.value.map((item) => normalizeLibraryItem(item, 'munajat')));
  if (pdfs.status === 'fulfilled') rows.push(...pdfs.value.map((item) => normalizeLibraryItem(item, 'pdf')));

  return rows;
};

export const ensureUserRecord = async (user) => {
  if (!user?.id || !isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      last_active: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    console.warn('Supabase user record is unavailable; local mode remains active.', error);
    return false;
  }

  return true;
};

export const fetchRemoteFavorites = async (userId) => {
  if (!userId || !isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('id, user_id, content_type, content_id, title, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => ({
    id: item.content_id,
    type: item.content_type,
    title: item.title || '',
    added_at: item.added_at,
    remote_id: item.id,
  }));
};
