import { supabase } from '../lib/supabase';
import { getCurrentWeekId } from '../utils/weekId';
import type { Recipe } from '../types';

export async function fetchWeeklyRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('week_id', getCurrentWeekId());

  if (error) throw error;
  return (data ?? []) as Recipe[];
}

export async function fetchSwipedRecipeIds(): Promise<string[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('swipes')
    .select('recipe_id')
    .eq('user_id', session.user.id)
    .eq('week_id', getCurrentWeekId());

  if (error) throw error;
  return (data ?? []).map((row: { recipe_id: string }) => row.recipe_id);
}
