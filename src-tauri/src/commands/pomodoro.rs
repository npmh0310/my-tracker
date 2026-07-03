use crate::{db::AppDb, models::PomodoroSession, tray};
use rusqlite::{params, Connection};
use tauri::{AppHandle, State};

#[tauri::command]
pub fn create_pomodoro_session(
    db: State<AppDb>,
    todo_id: Option<i64>,
    duration_minutes: i64,
    break_minutes: i64,
) -> Result<PomodoroSession, String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            INSERT INTO pomodoro_sessions (todo_id, duration_minutes, break_minutes, status)
            VALUES (?1, ?2, ?3, 'running')
            ",
            params![todo_id, duration_minutes, break_minutes],
        )
        .map_err(|error| error.to_string())?;

    get_pomodoro_session(&connection, connection.last_insert_rowid())
}

#[tauri::command]
pub fn complete_pomodoro_session(db: State<AppDb>, id: i64) -> Result<PomodoroSession, String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            UPDATE pomodoro_sessions
            SET ended_at = datetime('now', 'localtime'), status = 'completed'
            WHERE id = ?1
            ",
            params![id],
        )
        .map_err(|error| error.to_string())?;

    get_pomodoro_session(&connection, id)
}

#[tauri::command]
pub fn list_today_sessions(db: State<AppDb>) -> Result<Vec<PomodoroSession>, String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    let mut statement = connection
        .prepare(
            "
            SELECT id, todo_id, started_at, ended_at, duration_minutes, break_minutes, status
            FROM pomodoro_sessions
            WHERE date(started_at) = date('now', 'localtime')
            ORDER BY started_at DESC, id DESC
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(PomodoroSession {
                id: row.get(0)?,
                todo_id: row.get(1)?,
                started_at: row.get(2)?,
                ended_at: row.get(3)?,
                duration_minutes: row.get(4)?,
                break_minutes: row.get(5)?,
                status: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_pomodoro_tray_countdown(
    app: AppHandle,
    seconds_left: Option<i64>,
) -> Result<(), String> {
    tray::set_pomodoro_countdown(&app, seconds_left).map_err(|error| error.to_string())
}

fn get_pomodoro_session(connection: &Connection, id: i64) -> Result<PomodoroSession, String> {
    connection
        .query_row(
            "
            SELECT id, todo_id, started_at, ended_at, duration_minutes, break_minutes, status
            FROM pomodoro_sessions
            WHERE id = ?1
            ",
            params![id],
            |row| {
                Ok(PomodoroSession {
                    id: row.get(0)?,
                    todo_id: row.get(1)?,
                    started_at: row.get(2)?,
                    ended_at: row.get(3)?,
                    duration_minutes: row.get(4)?,
                    break_minutes: row.get(5)?,
                    status: row.get(6)?,
                })
            },
        )
        .map_err(|error| error.to_string())
}
