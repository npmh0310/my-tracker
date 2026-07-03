use crate::{db::AppDb, models::Todo};
use rusqlite::{params, Connection};
use tauri::State;

const COMPLETED_TODO_RETENTION_DAYS: i64 = 3;

fn validate_todo_status(status: &str) -> Result<(), String> {
    match status {
        "backlog" | "todo" | "doing" | "done" => Ok(()),
        _ => Err("status must be backlog, todo, doing, or done".to_string()),
    }
}

fn validate_todo_tag(tag: &str) -> Result<(), String> {
    match tag {
        "#madison" | "#peronal" | "#galophy" => Ok(()),
        _ => Err("tag must be #madison, #peronal, or #galophy".to_string()),
    }
}

#[tauri::command]
pub fn list_todos(db: State<AppDb>) -> Result<Vec<Todo>, String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    cleanup_expired_completed_todos(&connection)?;

    let mut statement = connection
        .prepare(
            "
            SELECT id, title, description, status, priority, tag, due_at, created_at, updated_at
            FROM todos
            ORDER BY
                CASE status
                    WHEN 'backlog' THEN 0
                    WHEN 'todo' THEN 1
                    WHEN 'doing' THEN 2
                    WHEN 'done' THEN 3
                END,
                updated_at DESC,
                id DESC
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(Todo {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                tag: row.get(5)?,
                due_at: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_todo(
    db: State<AppDb>,
    title: String,
    description: String,
    status: String,
    priority: String,
    tag: String,
    due_at: Option<String>,
) -> Result<Todo, String> {
    validate_todo_status(&status)?;
    validate_todo_tag(&tag)?;
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            INSERT INTO todos (title, description, status, priority, tag, due_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ",
            params![title.trim(), description.trim(), status, priority, tag, due_at],
        )
        .map_err(|error| error.to_string())?;

    get_todo(&connection, connection.last_insert_rowid())
}

#[tauri::command]
pub fn update_todo(
    db: State<AppDb>,
    id: i64,
    title: String,
    description: String,
    status: String,
    priority: String,
    tag: String,
    due_at: Option<String>,
) -> Result<Todo, String> {
    validate_todo_status(&status)?;
    validate_todo_tag(&tag)?;
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            UPDATE todos
            SET title = ?1,
                description = ?2,
                status = ?3,
                priority = ?4,
                tag = ?5,
                due_at = ?6,
                updated_at = datetime('now', 'localtime')
            WHERE id = ?7
            ",
            params![
                title.trim(),
                description.trim(),
                status,
                priority,
                tag,
                due_at,
                id
            ],
        )
        .map_err(|error| error.to_string())?;

    get_todo(&connection, id)
}

#[tauri::command]
pub fn move_todo(db: State<AppDb>, id: i64, status: String) -> Result<Todo, String> {
    validate_todo_status(&status)?;
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            UPDATE todos
            SET status = ?1, updated_at = datetime('now', 'localtime')
            WHERE id = ?2
            ",
            params![status, id],
        )
        .map_err(|error| error.to_string())?;

    get_todo(&connection, id)
}

#[tauri::command]
pub fn delete_todo(db: State<AppDb>, id: i64) -> Result<(), String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute("DELETE FROM todos WHERE id = ?1", params![id])
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn get_todo(connection: &Connection, id: i64) -> Result<Todo, String> {
    connection
        .query_row(
            "
            SELECT id, title, description, status, priority, tag, due_at, created_at, updated_at
            FROM todos
            WHERE id = ?1
            ",
            params![id],
            |row| {
                Ok(Todo {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    status: row.get(3)?,
                    priority: row.get(4)?,
                    tag: row.get(5)?,
                    due_at: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
        .map_err(|error| error.to_string())
}

fn cleanup_expired_completed_todos(connection: &Connection) -> Result<(), String> {
    connection
        .execute(
            "
            DELETE FROM todos
            WHERE status = 'done'
              AND updated_at <= datetime('now', 'localtime', ?1)
            ",
            params![format!("-{} days", COMPLETED_TODO_RETENTION_DAYS)],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}
