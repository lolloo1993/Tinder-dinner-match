import { supabase } from '../lib/supabase';
import { getCurrentWeekId } from '../utils/weekId';

export async function getPartnerSwipeCount(): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return 0;

  const myId = session.user.id;

  const { data: user } = await supabase
    .from('users')
    .select('couple_id')
    .eq('id', myId)
    .single();

  if (!user?.couple_id) return 0;

  const { data: couple } = await supabase
    .from('couples')
    .select('user_a_id, user_b_id')
    .eq('id', user.couple_id)
    .single();

  if (!couple) return 0;

  const partnerId =
    couple.user_a_id === myId ? couple.user_b_id : couple.user_a_id;

  const { count, error } = await supabase
    .from('swipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', partnerId)
    .eq('week_id', getCurrentWeekId());

  if (error) throw error;
  return count ?? 0;
}
