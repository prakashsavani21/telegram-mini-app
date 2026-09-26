# Number Challenge — Pro Telegram Mini App

A polished Telegram Mini App for a skill-based number challenge.

## Included
- Premium responsive mobile-first UI
- Telegram WebApp user name/avatar initials
- 10-round timed challenge
- Scoring + accuracy + best score
- Local fallback so the app works before Supabase setup
- Supabase leaderboard/player sync
- Reward Center with daily check-in and reward points
- Profile + achievements
- Bottom navigation
- `supabase-schema.sql` for the database

## Supabase
The frontend is already configured with the project URL and the publishable key supplied for this project. The publishable key is intended for browser use. Never put a Supabase secret/service-role key in this frontend.

Run `supabase-schema.sql` once in Supabase SQL Editor.

## Important for real prizes
The included reward points are promotional/virtual points. If you later attach cash or physical prizes, do not trust browser-submitted scores or reward balances. Use a server-side/Edge Function to validate game results, enforce eligibility/rate limits, and process claims. Add your own published reward terms and eligibility rules.

## Deploy
Upload the folder to GitHub Pages, Vercel, Netlify, or another HTTPS host, then use that HTTPS URL in BotFather's Mini App/Menu Button settings.
