# EQdb

EQdb is a community-driven site for finding and sharing EQ (equalizer) presets for headphones and earbuds. Pick your device, browse tunings other people have submitted and voted on, or add your own. Every profile can be exported as a ready-to-use Equalizer APO config file.

The idea came out of a simple frustration: good EQ presets for a given pair of headphones are usually scattered across Reddit threads, forum posts, and personal blogs, and most of them go stale or get buried over time. EQdb tries to put that information in one place, ranked by the people actually using it.

## What it does

- Search for a device by brand and model.
- See EQ profiles submitted for that device, ranked by community votes.
- Vote a profile up or down (one vote per person per profile, tracked without accounts).
- View the EQ curve as a chart, with gain and frequency clearly labeled.
- Submit your own tuning, either through a simple slider interface (when the device has known app-based EQ bands) or a full parametric editor.
- Export any profile as a `.txt` file formatted for Equalizer APO.
- Request a device that isn't in the list yet.

## Tech stack

**Frontend:** React, Vite, Tailwind CSS
**Backend:** Express.js, PostgreSQL (via `pg`)
**Hosting:** Vercel (frontend), Render (backend), Neon (database)

## Project structure

```
eqcommunity/
├── client/          React + Vite frontend
│   └── src/
│       ├── components/
│       └── utils/
└── server/          Express API
    ├── server.js
    └── database.sql
```

## Notes on the data

Device requests and submitted profiles aren't automatically added or verified. New devices from requests get reviewed and added manually, and profiles can be removed if they turn out to be spam or clearly wrong. There's no moderation queue in the UI yet, this is currently handled directly at the database level.

## Contributing

If you want to add a device, submit a tuning, or report a problem with existing data, the site itself is the easiest way to do that. Bug reports and pull requests are also welcome.

## License

Not yet decided. Treat the code as all rights reserved for now unless a license file is added.
