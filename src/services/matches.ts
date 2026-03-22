import { supabase } from '../lib/supabase';
import { getCurrentWeekId } from '../utils/weekId';
import type { Match } from '../types';

export async function fetchWeeklyMatches(): Promise<Match[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data: user } = await supabase
    .from('users')
    .select('couple_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.couple_id) return [];

  const { data, error } = await supabase
    .from('matches')
    .select('*, recipes(*)')
    .eq('couple_id', user.couple_id)
    .eq('week_id', getCurrentWeekId())
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Match[];
}
