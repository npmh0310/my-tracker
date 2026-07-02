use serde::Serialize;

#[derive(Serialize)]
pub struct Note {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct Todo {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub due_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct PomodoroSession {
    pub id: i64,
    pub todo_id: Option<i64>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_minutes: i64,
    pub break_minutes: i64,
    pub status: String,
}
