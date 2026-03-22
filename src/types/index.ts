export interface User {
  id: string;
  email: string;
  name: string;
  couple_code: string;
  couple_id: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  ingredients: unknown[];
  steps: unknown[];
  tags: string[];
  image_url: string | null;
  created_at: string;
}

export interface Couple {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
}

export interface Swipe {
  id: string;
  user_id: string;
  couple_id: string;
  recipe_id: string;
  week_id: string;
  direction: 'left' | 'right';
  created_at: string;
}

export interface Match {
  id: string;
  couple_id: string;
  recipe_id: string;
  week_id: string;
  created_at: string;
  // Present when fetched with .select('*, recipes(*)')
  recipes?: Recipe;
}
