// TheSportsDB API base. Uses your personal Premium key from the
// THESPORTSDB_KEY environment variable when set (much higher rate limits),
// otherwise falls back to the shared free demo key "3".
const KEY = process.env.THESPORTSDB_KEY ?? "3";

export const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;
