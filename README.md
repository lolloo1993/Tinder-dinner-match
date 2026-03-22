# DinnerMatch

A React Native app (Expo + TypeScript) where couples swipe on recipe cards independently and get matched when both swipe right. Goal: 5 matches per week = their dinner plan.

## Stack

- Expo SDK 51 + TypeScript
- React Navigation v6
- Supabase (auth + database + real-time)
- React Native Reanimated v3

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase project credentials in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in your Supabase dashboard under **Project Settings → API**.

### 3. Deploy the database schema

The schema must be run manually in the Supabase dashboard:

1. Open your Supabase project at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Open `supabase/schema.sql` from this repo and paste the entire contents into the editor
5. Click **Run** (or press `Cmd/Ctrl + Enter`)

This creates all tables (`users`, `couples`, `recipes`, `swipes`, `matches`) along with the `check_for_match` trigger that automatically inserts a row into `matches` whenever both partners in a couple swipe right on the same recipe in the same week.

> **Note:** The schema does not use `IF NOT EXISTS` guards intentionally — if you need to re-run it, drop the existing tables first or apply incremental migrations.

### 4. Start the app

```bash
npx expo start
```

## Database schema overview

| Table     | Purpose |
|-----------|---------|
| `users`   | App profile, linked 1-to-1 with `auth.users` |
| `couples` | Links two users as a couple |
| `recipes` | Weekly recipe cards for swiping |
| `swipes`  | Records each user's left/right swipe per recipe per week |
| `matches` | Auto-populated when both partners swipe right on the same recipe |

The match-detection trigger (`on_swipe_insert` → `check_for_match`) runs server-side after every swipe insert, so no client coordination is needed.
