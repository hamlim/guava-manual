import "server-only";
import Database from "better-sqlite3";

let db = new Database(":memory:");
db.pragma("journal_mode = WAL");

db.prepare(
  "CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER)",
).run();

export { db };
