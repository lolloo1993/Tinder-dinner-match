import { supabase } from '../lib/supabase';
import { generateCoupleCode } from '../utils/coupleCode';
import type { User } from '../types';

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign up succeeded but no user was returned.');

  const { error: insertError } = await supabase.from('users').insert({
    id: data.user.id,
    email,
    name,
    couple_code: generateCoupleCode(),
  });
  if (insertError) throw insertError;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return null;
  return data as User;
}
