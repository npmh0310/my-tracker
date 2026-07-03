use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};
#[cfg(not(debug_assertions))]
use tauri::WindowEvent;

const TRAY_CARD_LABEL: &str = "tray-card";
const TRAY_CARD_WIDTH: f64 = 360.0;
const TRAY_CARD_HEIGHT: f64 = 420.0;
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

    TrayIconBuilder::with_id("main-tray")
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
        button,
        button_state,
        ..
    } = event
    {
        if button == MouseButton::Left && button_state == MouseButtonState::Up {
            let _ = toggle_tray_card(app, position);
        }
    }
}

fn toggle_tray_card(app: &tauri::AppHandle, click_position: PhysicalPosition<f64>) -> tauri::Result<()> {
    let window = match app.get_webview_window(TRAY_CARD_LABEL) {
        Some(window) => window,
        None => create_tray_card_window(app)?,
    };

    position_tray_card(app, &window, click_position)?;

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

    #[cfg(not(debug_assertions))]
    {
        let tray_window = window.clone();
        window.on_window_event(move |event| {
            if matches!(event, WindowEvent::Focused(false)) {
                let _ = tray_window.hide();
            }
        });
    }

    Ok(window)
}

fn position_tray_card(
    app: &tauri::AppHandle,
    window: &WebviewWindow,
    click_position: PhysicalPosition<f64>,
) -> tauri::Result<()> {
    let monitor = app
        .available_monitors()?
        .into_iter()
        .find(|monitor| {
            let position = monitor.position();
            let size = monitor.size();
            click_position.x >= position.x as f64
                && click_position.x <= (position.x + size.width as i32) as f64
                && click_position.y >= position.y as f64
                && click_position.y <= (position.y + size.height as i32) as f64
        })
        .or(app.primary_monitor()?);

    let (x, y) = if let Some(monitor) = monitor {
        let position = monitor.position();
        let size = monitor.size();
        let right_edge = (position.x + size.width as i32) as f64;
        let top_edge = position.y as f64;
        let x = (click_position.x - TRAY_CARD_WIDTH + 24.0)
            .max(position.x as f64 + TRAY_CARD_MARGIN)
            .min(right_edge - TRAY_CARD_WIDTH - TRAY_CARD_MARGIN);
        let y = (click_position.y + TRAY_CARD_MARGIN)
            .max(top_edge + TRAY_CARD_MARGIN)
            .min((position.y + size.height as i32) as f64 - TRAY_CARD_HEIGHT - TRAY_CARD_MARGIN);

        (x, y)
    } else {
        (
            (click_position.x - TRAY_CARD_WIDTH + 24.0).max(TRAY_CARD_MARGIN),
            (click_position.y + TRAY_CARD_MARGIN).max(TRAY_CARD_MARGIN),
        )
    };

    window.set_position(PhysicalPosition::new(x as i32, y as i32))?;
    Ok(())
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

    draw_rounded_rect(&mut rgba, SIZE, 7, 5, 17, 21, 3, 2);
    draw_line(&mut rgba, SIZE, 12, 6, 12, 25, 2);
    draw_line(&mut rgba, SIZE, 9, 10, 11, 10, 1);
    draw_line(&mut rgba, SIZE, 9, 15, 11, 15, 1);
    draw_line(&mut rgba, SIZE, 9, 20, 11, 20, 1);

    draw_line(&mut rgba, SIZE, 19, 23, 27, 15, 3);
    draw_line(&mut rgba, SIZE, 24, 12, 28, 16, 2);
    draw_line(&mut rgba, SIZE, 18, 24, 16, 26, 2);

    Image::new_owned(rgba, SIZE, SIZE)
}

fn draw_rounded_rect(
    rgba: &mut [u8],
    size: u32,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
    radius: i32,
    thickness: i32,
) {
    draw_line(rgba, size, x + radius, y, x + width - radius, y, thickness);
    draw_line(
        rgba,
        size,
        x + radius,
        y + height,
        x + width - radius,
        y + height,
        thickness,
    );
    draw_line(rgba, size, x, y + radius, x, y + height - radius, thickness);
    draw_line(
        rgba,
        size,
        x + width,
        y + radius,
        x + width,
        y + height - radius,
        thickness,
    );

    draw_point(rgba, size, x + 1, y + 1, thickness);
    draw_point(rgba, size, x + width - 1, y + 1, thickness);
    draw_point(rgba, size, x + 1, y + height - 1, thickness);
    draw_point(rgba, size, x + width - 1, y + height - 1, thickness);
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
