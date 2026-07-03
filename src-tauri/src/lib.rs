mod commands;
mod db;
mod models;
mod tray;

use commands::{
    notes::{create_note, delete_note, list_notes, update_note},
    pomodoro::{complete_pomodoro_session, create_pomodoro_session, list_today_sessions},
    todos::{create_todo, delete_todo, list_todos, move_todo, update_todo},
};
use db::{init_db, AppDb};
use rusqlite::Connection;
use std::fs;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|error| error.to_string())?;
            fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;

            let db_path = app_data_dir.join("personal-tracker.sqlite3");
            let connection = Connection::open(db_path).map_err(|error| error.to_string())?;
            init_db(&connection)?;
            app.manage(AppDb(std::sync::Mutex::new(connection)));
            tray::setup(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_notes,
            create_note,
            update_note,
            delete_note,
            list_todos,
            create_todo,
            update_todo,
            move_todo,
            delete_todo,
            create_pomodoro_session,
            complete_pomodoro_session,
            list_today_sessions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
