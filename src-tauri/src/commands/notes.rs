use crate::{db::AppDb, models::Note};
use rusqlite::{params, Connection};
use tauri::State;

fn validate_note_type(content_type: &str) -> Result<(), String> {
    match content_type {
        "plain" | "json" => Ok(()),
        _ => Err("content_type must be plain or json".to_string()),
    }
}

#[tauri::command]
pub fn list_notes(db: State<AppDb>) -> Result<Vec<Note>, String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    let mut statement = connection
        .prepare(
            "
            SELECT id, title, content, content_type, created_at, updated_at
            FROM notes
            ORDER BY updated_at DESC, id DESC
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                content_type: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_note(
    db: State<AppDb>,
    title: String,
    content: String,
    content_type: String,
) -> Result<Note, String> {
    validate_note_type(&content_type)?;
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            INSERT INTO notes (title, content, content_type)
            VALUES (?1, ?2, ?3)
            ",
            params![title.trim(), content, content_type],
        )
        .map_err(|error| error.to_string())?;

    get_note(&connection, connection.last_insert_rowid())
}

#[tauri::command]
pub fn update_note(
    db: State<AppDb>,
    id: i64,
    title: String,
    content: String,
    content_type: String,
) -> Result<Note, String> {
    validate_note_type(&content_type)?;
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute(
            "
            UPDATE notes
            SET title = ?1, content = ?2, content_type = ?3, updated_at = datetime('now', 'localtime')
            WHERE id = ?4
            ",
            params![title.trim(), content, content_type, id],
        )
        .map_err(|error| error.to_string())?;

    get_note(&connection, id)
}

#[tauri::command]
pub fn delete_note(db: State<AppDb>, id: i64) -> Result<(), String> {
    let connection = db.0.lock().map_err(|error| error.to_string())?;
    connection
        .execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn get_note(connection: &Connection, id: i64) -> Result<Note, String> {
    connection
        .query_row(
            "
            SELECT id, title, content, content_type, created_at, updated_at
            FROM notes
            WHERE id = ?1
            ",
            params![id],
            |row| {
                Ok(Note {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    content_type: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|error| error.to_string())
}
