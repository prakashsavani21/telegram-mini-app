# Number Challenge Pro v3

Premium Telegram Mini App for a skill-based number challenge.

## Features
- 10-round timed number challenge
- Points, streaks, achievements and local progress
- Daily check-in bonus (25+ points, increasing with streak)
- Reward milestone tracking at 250 / 500 / 1000 points
- All-time, weekly and today leaderboard tabs
- Supabase player and game-result sync
- Telegram WebApp user display
- Mobile-first premium UI

## Deploy
Upload the contents of this folder to the root of the GitHub Pages repository. Do not upload the ZIP itself.

## Supabase
Run `supabase-schema.sql` once in the Supabase SQL Editor. The frontend uses only the publishable key. Never put a Supabase secret/service-role key in the browser.

## Rewards
The app currently uses promotional reward points. Real-money or prize redemption is intentionally not automatic; an operator-controlled redemption/backend flow should be added before offering actual prizes.
