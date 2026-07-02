use rusqlite::Connection;
use std::sync::Mutex;

pub struct AppDb(pub Mutex<Connection>);

pub fn init_db(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_type TEXT NOT NULL CHECK(content_type IN ('plain', 'json')),
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL CHECK(status IN ('backlog', 'todo', 'doing', 'done')),
                priority TEXT NOT NULL DEFAULT 'normal',
                due_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS pomodoro_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                todo_id INTEGER,
                started_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                ended_at TEXT,
                duration_minutes INTEGER NOT NULL,
                break_minutes INTEGER NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'cancelled')),
                FOREIGN KEY(todo_id) REFERENCES todos(id) ON DELETE SET NULL
            );
            ",
        )
        .map_err(|error| error.to_string())?;

    ensure_column(connection, "todos", "due_at", "TEXT")?;
    Ok(())
}

fn ensure_column(
    connection: &Connection,
    table: &str,
    column: &str,
    column_type: &str,
) -> Result<(), String> {
    let mut statement = connection
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?;

    let mut exists = false;
    for row in rows {
        if row.map_err(|error| error.to_string())? == column {
            exists = true;
            break;
        }
    }

    if !exists {
        connection
            .execute(
                &format!("ALTER TABLE {table} ADD COLUMN {column} {column_type}"),
                [],
            )
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}
