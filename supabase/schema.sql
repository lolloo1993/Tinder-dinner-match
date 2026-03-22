CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL,
  user_b_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  couple_code TEXT UNIQUE NOT NULL,
  couple_id UUID REFERENCES couples(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  couple_id UUID NOT NULL REFERENCES couples(id),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  week_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, recipe_id, week_id)
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  week_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (couple_id, recipe_id, week_id)
);

-- Auto-create a match when both partners swipe right
CREATE OR REPLACE FUNCTION check_for_match()
RETURNS TRIGGER AS $$
DECLARE
  other_user_id UUID;
  match_exists BOOLEAN;
BEGIN
  IF NEW.direction != 'right' THEN RETURN NEW; END IF;
  SELECT CASE
    WHEN user_a_id = NEW.user_id THEN user_b_id ELSE user_a_id
  END INTO other_user_id FROM couples WHERE id = NEW.couple_id;
  SELECT EXISTS (
    SELECT 1 FROM swipes
    WHERE user_id = other_user_id
      AND recipe_id = NEW.recipe_id
      AND week_id = NEW.week_id
      AND direction = 'right'
  ) INTO match_exists;
  IF match_exists THEN
    INSERT INTO matches (couple_id, recipe_id, week_id)
    VALUES (NEW.couple_id, NEW.recipe_id, NEW.week_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_swipe_insert
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION check_for_match();
