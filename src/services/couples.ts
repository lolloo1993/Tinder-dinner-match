import { supabase } from '../lib/supabase';

export class CoupleLinkError extends Error {
  constructor(public readonly code: 'SELF_LINK' | 'PARTNER_NOT_FOUND' | 'ALREADY_LINKED') {
    super(code);
    this.name = 'CoupleLinkError';
  }
}

export async function getMyCode(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated.');

  const { data, error } = await supabase
    .from('users')
    .select('couple_code')
    .eq('id', session.user.id)
    .single();

  if (error || !data) throw new Error('Could not fetch your couple code.');
  return (data as { couple_code: string }).couple_code;
}

export async function linkCouple(partnerCode: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated.');

  const myId = session.user.id;
  const code = partnerCode.toUpperCase();

  // Fetch own profile to check couple_code and couple_id
  const { data: me, error: meError } = await supabase
    .from('users')
    .select('couple_code, couple_id')
    .eq('id', myId)
    .single();

  if (meError || !me) throw new Error('Could not fetch your profile.');

  const profile = me as { couple_code: string; couple_id: string | null };

  if (profile.couple_id !== null) throw new CoupleLinkError('ALREADY_LINKED');
  if (profile.couple_code === code) throw new CoupleLinkError('SELF_LINK');

  // Find partner by code
  const { data: partner, error: partnerError } = await supabase
    .from('users')
    .select('id')
    .eq('couple_code', code)
    .maybeSingle();

  if (partnerError) throw partnerError;
  if (!partner) throw new CoupleLinkError('PARTNER_NOT_FOUND');

  const partnerId = (partner as { id: string }).id;

  // Create couple row
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({ user_a_id: myId, user_b_id: partnerId })
    .select('id')
    .single();

  if (coupleError || !couple) throw new Error('Could not create couple.');

  const coupleId = (couple as { id: string }).id;

  // Update both users' couple_id
  const { error: updateError } = await supabase
    .from('users')
    .update({ couple_id: coupleId })
    .in('id', [myId, partnerId]);

  if (updateError) throw updateError;
}
