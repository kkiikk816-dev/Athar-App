import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const read = async (query) => {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: 'Supabase is not configured' };

  try {
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
};

/**
 * Reads only the tables needed for the Home and Prayers screens.
 * A failed table must not prevent local fallback data from rendering.
 */
const sortFeatured = (items) => {
  return [...items].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    const scoreA = a.send_score || 0;
    const scoreB = b.send_score || 0;
    return scoreB - scoreA;
  });
};

export const fetchTodayContent = async ({ hijriDate, weekday }) => {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: 'Supabase is not configured' };

  const [eventsRes, weeklyRes, duasRes, ziyaratRes, taqibatRes] = await Promise.all([
    read(supabase.from('hijri_events').select('*').eq('hijri_date', hijriDate)),
    read(supabase.from('weekly_content').select('*').eq('weekday', weekday)),
    read(supabase.from('weekly_duas').select('*').eq('weekday', weekday)),
    read(supabase.from('weekly_ziyarat').select('*').eq('weekday', weekday)),
    read(supabase.from('taqibat').select('*')),
  ]);

  const hasError = eventsRes.error || weeklyRes.error || taqibatRes.error;
  
  const weekly = [];
  if (!weeklyRes.error) weekly.push(...weeklyRes.data.map((item) => normalizeLibraryItem(item, 'weekly')));
  if (!duasRes.error) weekly.push(...duasRes.data.map((item) => normalizeLibraryItem(item, 'dua')));
  if (!ziyaratRes.error) weekly.push(...ziyaratRes.data.map((item) => normalizeLibraryItem(item, 'ziyara')));

  return {
    data: {
      events: !eventsRes.error ? eventsRes.data : null,
      weekly: weekly.length > 0 ? sortFeatured(weekly) : null,
      taqibat: !taqibatRes.error ? sortFeatured(taqibatRes.data) : null,
    },
    error: hasError ? 'Some queries failed' : null
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
  if (!isSupabaseConfigured || !supabase) return { data: [], error: 'Supabase is not configured' };

  const [weeklyRes, duasRes, ziyaratRes, munajatRes, pdfsRes] = await Promise.all([
    read(supabase.from('weekly_content').select('*')),
    read(supabase.from('weekly_duas').select('*')),
    read(supabase.from('weekly_ziyarat').select('*')),
    read(supabase.from('munajat').select('*')),
    read(supabase.from('pdf_library').select('*')),
  ]);

  const rows = [];
  
  if (!weeklyRes.error) rows.push(...weeklyRes.data.map((item) => normalizeLibraryItem(item, 'weekly')));
  if (!duasRes.error) rows.push(...duasRes.data.map((item) => normalizeLibraryItem(item, 'dua')));
  if (!ziyaratRes.error) rows.push(...ziyaratRes.data.map((item) => normalizeLibraryItem(item, 'ziyara')));
  if (!munajatRes.error) rows.push(...munajatRes.data.map((item) => normalizeLibraryItem(item, 'munajat')));
  if (!pdfsRes.error) rows.push(...pdfsRes.data.map((item) => normalizeLibraryItem(item, 'pdf')));

  const hasError = weeklyRes.error || duasRes.error || ziyaratRes.error || munajatRes.error || pdfsRes.error;
  return { data: rows, error: hasError ? 'Some library queries failed' : null };
};

export const fetchHadiths = async (page = 0, limit = 20) => {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: 'Supabase is not configured' };
  const from = page * limit;
  const to = from + limit - 1;
  const res = await read(supabase.from('hadiths').select('*').range(from, to));
  if (res.error) return { data: [], error: res.error };
  return { 
    data: res.data.map(item => normalizeLibraryItem({ ...item, title: `حديث ${item.author ? 'عن ' + item.author : '#' + item.id}` }, 'hadith')),
    error: null
  };
};

export const fetchWisdoms = async (page = 0, limit = 20) => {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: 'Supabase is not configured' };
  const from = page * limit;
  const to = from + limit - 1;
  const res = await read(supabase.from('wisdoms').select('*').range(from, to));
  if (res.error) return { data: [], error: res.error };
  return { 
    data: res.data.map(item => normalizeLibraryItem({ ...item, title: `حكمة ${item.author ? 'عن ' + item.author : '#' + item.id}` }, 'wisdom')),
    error: null
  };
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
