use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, Rect, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};

const TRAY_CARD_LABEL: &str = "tray-card";
const MAIN_TRAY_ID: &str = "main-tray";
const TRAY_CARD_WIDTH: f64 = 450.0;
const TRAY_CARD_HEIGHT: f64 = 600.0;
const TRAY_CARD_MARGIN: f64 = 12.0;

enum TrayAction {
    Show,
    Quit,
}

impl TrayAction {
    fn id(&self) -> &'static str {
        match self {
            Self::Show => "show",
            Self::Quit => "quit",
        }
    }

    fn from_id(id: &str) -> Option<Self> {
        match id {
            "show" => Some(Self::Show),
            "quit" => Some(Self::Quit),
            _ => None,
        }
    }
}

pub fn setup(app: &tauri::App) -> tauri::Result<()> {
    let menu = build_menu(app)?;

    TrayIconBuilder::with_id(MAIN_TRAY_ID)
        .icon(tray_icon())
        .icon_as_template(true)
        .tooltip("Personal Tracker")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| handle_menu_event(app, event.id().as_ref()))
        .on_tray_icon_event(|tray, event| handle_tray_icon_event(tray.app_handle(), event))
        .build(app)?;

    Ok(())
}

pub fn set_pomodoro_countdown(
    app: &tauri::AppHandle,
    seconds_left: Option<i64>,
) -> tauri::Result<()> {
    if let Some(tray) = app.tray_by_id(MAIN_TRAY_ID) {
        if let Some(seconds_left) = seconds_left {
            let seconds_left = seconds_left.max(0);
            if seconds_left == 0 {
                reset_tray_icon(&tray)?;
                return Ok(());
            }

            let time_label = format_countdown_time(seconds_left);
            tray.set_icon_with_as_template(Some(pomodoro_tray_icon()), true)?;
            tray.set_title(Some(time_label.as_str()))?;
            tray.set_tooltip(Some(format!("Pomodoro {time_label}")))?;
        } else {
            reset_tray_icon(&tray)?;
        }
    }

    Ok(())
}

fn reset_tray_icon(tray: &tauri::tray::TrayIcon<tauri::Wry>) -> tauri::Result<()> {
    tray.set_icon_with_as_template(Some(tray_icon()), true)?;
    tray.set_title(Some(""))?;
    tray.set_tooltip(Some("Personal Tracker"))?;
    Ok(())
}

fn build_menu(app: &tauri::App) -> tauri::Result<Menu<tauri::Wry>> {
    let show = MenuItem::with_id(
        app,
        TrayAction::Show.id(),
        "Open Personal Tracker",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, TrayAction::Quit.id(), "Quit", true, None::<&str>)?;

    Menu::with_items(app, &[&show, &quit])
}

fn handle_menu_event(app: &tauri::AppHandle, id: &str) {
    match TrayAction::from_id(id) {
        Some(TrayAction::Show) => show_main_window(app),
        Some(TrayAction::Quit) => app.exit(0),
        None => {}
    }
}

fn handle_tray_icon_event(app: &tauri::AppHandle, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        position,
        rect,
        button,
        button_state,
        ..
    } = event
    {
        if button == MouseButton::Left && button_state == MouseButtonState::Up {
            let _ = toggle_tray_card(app, position, rect);
        }
    }
}

fn toggle_tray_card(
    app: &tauri::AppHandle,
    click_position: PhysicalPosition<f64>,
    tray_rect: Rect,
) -> tauri::Result<()> {
    let window = match app.get_webview_window(TRAY_CARD_LABEL) {
        Some(window) => window,
        None => create_tray_card_window(app)?,
    };
    let anchor_position = tray_anchor_position(app, click_position, tray_rect)?;
    let next_position = tray_card_position(app, anchor_position)?;

    if window.is_visible()? {
        if let Ok(current_position) = window.outer_position() {
            let distance_x = (current_position.x - next_position.x).abs();
            let distance_y = (current_position.y - next_position.y).abs();

            if distance_x < 8 && distance_y < 8 {
                window.hide()?;
                return Ok(());
            }
        }
    }

    window.set_position(next_position)?;

    window.show()?;
    window.set_focus()?;

    Ok(())
}

fn create_tray_card_window(app: &tauri::AppHandle) -> tauri::Result<WebviewWindow> {
    let window = WebviewWindowBuilder::new(
        app,
        TRAY_CARD_LABEL,
        WebviewUrl::App("index.html?view=tray-card".into()),
    )
    .title("Personal Tracker")
    .inner_size(TRAY_CARD_WIDTH, TRAY_CARD_HEIGHT)
    .min_inner_size(TRAY_CARD_WIDTH, TRAY_CARD_HEIGHT)
    .max_inner_size(TRAY_CARD_WIDTH, TRAY_CARD_HEIGHT)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(false)
    .visible(false)
    .focused(false)
    .build()?;

    let tray_window = window.clone();
    window.on_window_event(move |event| {
        if matches!(event, WindowEvent::Focused(false)) {
            let _ = tray_window.hide();
        }
    });

    Ok(window)
}

fn tray_card_position(
    app: &tauri::AppHandle,
    anchor_position: PhysicalPosition<f64>,
) -> tauri::Result<PhysicalPosition<i32>> {
    let monitor = app
        .available_monitors()?
        .into_iter()
        .find(|monitor| {
            let position = monitor.position();
            let size = monitor.size();
            anchor_position.x >= position.x as f64
                && anchor_position.x <= (position.x + size.width as i32) as f64
                && anchor_position.y >= position.y as f64
                && anchor_position.y <= (position.y + size.height as i32) as f64
        })
        .or(app.primary_monitor()?);

    let (x, y) = if let Some(monitor) = monitor {
        let position = monitor.position();
        let size = monitor.size();
        let card_width = TRAY_CARD_WIDTH;
        let card_height = TRAY_CARD_HEIGHT;
        let card_margin = TRAY_CARD_MARGIN;
        let right_edge = (position.x + size.width as i32) as f64;
        let top_edge = position.y as f64;
        let bottom_edge = (position.y + size.height as i32) as f64;
        let min_x = position.x as f64 + card_margin;
        let min_y = top_edge + card_margin;
        let max_x = (right_edge - card_width - card_margin).max(min_x);
        let max_y = (bottom_edge - card_height - card_margin).max(min_y);
        let x = (anchor_position.x - card_width + 24.0).clamp(min_x, max_x);
        let y = (anchor_position.y + card_margin).clamp(min_y, max_y);

        (x, y)
    } else {
        (
            (anchor_position.x - TRAY_CARD_WIDTH + 24.0).max(TRAY_CARD_MARGIN),
            (anchor_position.y + TRAY_CARD_MARGIN).max(TRAY_CARD_MARGIN),
        )
    };

    Ok(PhysicalPosition::new(x as i32, y as i32))
}

fn tray_anchor_position(
    app: &tauri::AppHandle,
    fallback_position: PhysicalPosition<f64>,
    tray_rect: Rect,
) -> tauri::Result<PhysicalPosition<f64>> {
    let monitors = app.available_monitors()?;

    for monitor in &monitors {
        let scale_factor = monitor.scale_factor();
        let rect_position = tray_rect.position.to_physical::<f64>(scale_factor);
        let rect_size = tray_rect.size.to_physical::<f64>(scale_factor);
        let anchor_position = PhysicalPosition::new(
            rect_position.x + rect_size.width / 2.0,
            rect_position.y + rect_size.height,
        );

        if monitor_contains_position(monitor, anchor_position) {
            return Ok(anchor_position);
        }
    }

    Ok(fallback_position)
}

fn monitor_contains_position(
    monitor: &tauri::Monitor,
    position: PhysicalPosition<f64>,
) -> bool {
    let monitor_position = monitor.position();
    let monitor_size = monitor.size();
    let min_x = monitor_position.x as f64;
    let min_y = monitor_position.y as f64;
    let max_x = (monitor_position.x + monitor_size.width as i32) as f64;
    let max_y = (monitor_position.y + monitor_size.height as i32) as f64;

    position.x >= min_x && position.x <= max_x && position.y >= min_y && position.y <= max_y
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn tray_icon() -> Image<'static> {
    const SIZE: u32 = 32;
    let mut rgba = vec![0; (SIZE * SIZE * 4) as usize];

    fill_circle(&mut rgba, SIZE, 16, 8, 5);
    fill_ellipse(&mut rgba, SIZE, 16, 25, 12, 9);

    Image::new_owned(rgba, SIZE, SIZE)
}

fn pomodoro_tray_icon() -> Image<'static> {
    const SIZE: u32 = 32;
    let mut rgba = vec![0; (SIZE * SIZE * 4) as usize];

    draw_circle_outline(&mut rgba, SIZE, 16, 17, 10, 2);
    draw_line(&mut rgba, SIZE, 16, 17, 16, 10, 2);
    draw_line(&mut rgba, SIZE, 16, 17, 22, 17, 2);
    draw_line(&mut rgba, SIZE, 12, 4, 20, 4, 2);
    draw_line(&mut rgba, SIZE, 16, 4, 16, 7, 2);
    draw_line(&mut rgba, SIZE, 8, 9, 6, 7, 2);
    draw_line(&mut rgba, SIZE, 24, 9, 26, 7, 2);

    Image::new_owned(rgba, SIZE, SIZE)
}

fn format_countdown_time(seconds_left: i64) -> String {
    let minutes = seconds_left / 60;
    let seconds = seconds_left % 60;
    format!("{minutes}:{seconds:02}")
}

fn draw_circle_outline(
    rgba: &mut [u8],
    size: u32,
    center_x: i32,
    center_y: i32,
    radius: i32,
    thickness: i32,
) {
    let outer = radius * radius;
    let inner_radius = (radius - thickness).max(0);
    let inner = inner_radius * inner_radius;

    for y in (center_y - radius)..=(center_y + radius) {
        for x in (center_x - radius)..=(center_x + radius) {
            let distance = (x - center_x).pow(2) + (y - center_y).pow(2);
            if distance <= outer && distance >= inner {
                draw_point(rgba, size, x, y, 1);
            }
        }
    }
}

fn fill_circle(rgba: &mut [u8], size: u32, center_x: i32, center_y: i32, radius: i32) {
    let radius_squared = radius * radius;

    for y in (center_y - radius)..=(center_y + radius) {
        for x in (center_x - radius)..=(center_x + radius) {
            let distance = (x - center_x).pow(2) + (y - center_y).pow(2);
            if distance <= radius_squared {
                draw_point(rgba, size, x, y, 1);
            }
        }
    }
}

fn fill_ellipse(
    rgba: &mut [u8],
    size: u32,
    center_x: i32,
    center_y: i32,
    radius_x: i32,
    radius_y: i32,
) {
    let radius_x_squared = radius_x * radius_x;
    let radius_y_squared = radius_y * radius_y;
    let threshold = radius_x_squared * radius_y_squared;

    for y in (center_y - radius_y)..=(center_y + radius_y) {
        for x in (center_x - radius_x)..=(center_x + radius_x) {
            let dx = x - center_x;
            let dy = y - center_y;
            let distance = dx * dx * radius_y_squared + dy * dy * radius_x_squared;
            if distance <= threshold {
                draw_point(rgba, size, x, y, 1);
            }
        }
    }
}

fn draw_line(
    rgba: &mut [u8],
    size: u32,
    mut x0: i32,
    mut y0: i32,
    x1: i32,
    y1: i32,
    thickness: i32,
) {
    let dx = (x1 - x0).abs();
    let sx = if x0 < x1 { 1 } else { -1 };
    let dy = -(y1 - y0).abs();
    let sy = if y0 < y1 { 1 } else { -1 };
    let mut err = dx + dy;

    loop {
        draw_point(rgba, size, x0, y0, thickness);
        if x0 == x1 && y0 == y1 {
            break;
        }
        let e2 = 2 * err;
        if e2 >= dy {
            err += dy;
            x0 += sx;
        }
        if e2 <= dx {
            err += dx;
            y0 += sy;
        }
    }
}

fn draw_point(rgba: &mut [u8], size: u32, x: i32, y: i32, thickness: i32) {
    let radius = thickness / 2;
    for offset_y in -radius..=radius {
        for offset_x in -radius..=radius {
            let px = x + offset_x;
            let py = y + offset_y;
            if px < 0 || py < 0 || px >= size as i32 || py >= size as i32 {
                continue;
            }

            let index = ((py as u32 * size + px as u32) * 4) as usize;
            rgba[index] = 0;
            rgba[index + 1] = 0;
            rgba[index + 2] = 0;
            rgba[index + 3] = 255;
        }
    }
}
