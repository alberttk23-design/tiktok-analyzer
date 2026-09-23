import json
import os
import shutil
import sqlite3
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Dict, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
PROFILE_DIR = BASE_DIR / "data" / "browser_profile"
COOKIES_DB = PROFILE_DIR / "Default" / "Cookies"

_active_browser_lock = threading.Lock()
_active_browser_proc = None


def get_session_status() -> Dict:
    """
    Check if the Playwright browser profile contains an authenticated TikTok session.
    Inspects the SQLite cookies database inside data/browser_profile/Default/Cookies.
    """
    if not PROFILE_DIR.exists():
        return {
            "is_logged_in": False,
            "status": "no_profile",
            "message": "Chưa khởi tạo profile trình duyệt (Chế độ khách)",
            "cookie_count": 0,
            "user_id": None
        }

    if not COOKIES_DB.exists():
        return {
            "is_logged_in": False,
            "status": "guest",
            "message": "Chưa đăng nhập tài khoản TikTok (Chế độ khách)",
            "cookie_count": 0,
            "user_id": None
        }

    try:
        # SQLite Cookies file might be locked if a browser is currently open, so open in read-only URI mode
        uri = f"file:{COOKIES_DB.resolve()}?mode=ro"
        conn = sqlite3.connect(uri, uri=True, timeout=3.0)
        c = conn.cursor()
        c.execute("""
            SELECT name, host_key 
            FROM cookies 
            WHERE host_key LIKE '%tiktok.com%'
        """)
        rows = c.fetchall()
        conn.close()

        cookie_names = {r[0] for r in rows}
        # TikTok login session cookie identifiers
        auth_cookie_names = {"sessionid", "sessionid_ss", "sid_guard", "uid_tt", "uid_tt_ss"}
        has_auth = any(ac in cookie_names for ac in auth_cookie_names)

        if has_auth:
            return {
                "is_logged_in": True,
                "status": "logged_in",
                "message": "Đã đăng nhập tài khoản TikTok (Cookie phiên hoạt động)",
                "cookie_count": len(rows),
                "auth_keys": list(cookie_names & auth_cookie_names)
            }
        else:
            return {
                "is_logged_in": False,
                "status": "guest",
                "message": "Chưa đăng nhập (Chế độ khách, không có sessionid)",
                "cookie_count": len(rows),
                "auth_keys": []
            }
    except Exception as e:
        return {
            "is_logged_in": False,
            "status": "unknown",
            "message": f"Không thể đọc file cookies ({str(e)})",
            "cookie_count": 0,
            "auth_keys": []
        }


def launch_gui_browser_for_login(target_url: str = "https://www.tiktok.com/login") -> Dict:
    """
    Launch interactive Chromium browser with the persistent profile on user screen.
    User can log in (QR code, email, Google), solve captcha, log out, or switch accounts.
    Runs in a detached non-blocking subprocess or script so backend API doesn't hang.
    """
    script_path = BASE_DIR / "scripts" / "interactive_login.py"
    script_path.parent.mkdir(parents=True, exist_ok=True)

    with open(script_path, "w", encoding="utf-8") as f:
        f.write(f'''# Auto-generated interactive login helper
import time
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

profile = Path(r"{PROFILE_DIR.resolve()}")
target = "{target_url}"

print("[Login Helper] Launching interactive browser for profile:", profile)
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(profile),
        headless=False,
        viewport={{"width": 1280, "height": 850}},
        args=["--disable-blink-features=AutomationControlled"],
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    try:
        page.goto(target, timeout=45000)
    except Exception as e:
        print("[Login Helper] Nav notice:", e)

    print("[Login Helper] Browser is open. Log in or switch accounts freely.")
    print("[Login Helper] When finished, simply close the browser window.")

    # Keep alive until user closes all browser windows
    while len(ctx.pages) > 0:
        try:
            time.sleep(1)
        except (KeyboardInterrupt, Exception):
            break

    try:
        ctx.close()
    except Exception:
        pass
    print("[Login Helper] Browser closed. Session saved.")
''')

    # Run in background via Python
    venv_python = BASE_DIR / ".venv" / "bin" / "python3"
    python_cmd = str(venv_python) if venv_python.exists() else sys.executable

    subprocess.Popen([python_cmd, str(script_path)])
    return {
        "status": "opened",
        "message": "Đã mở cửa sổ trình duyệt trên màn hình! Bạn hãy đăng nhập bằng mã QR hoặc tài khoản rồi đóng cửa sổ lại."
    }


def clear_session() -> Dict:
    """
    Clear all saved cookies and session tokens from data/browser_profile
    so the user can start completely fresh or switch to a new account if the old one died.
    """
    if not PROFILE_DIR.exists():
        return {"status": "success", "message": "Profile chưa tồn tại."}

    # Delete Cookies SQLite files if exists
    deleted_items = []
    default_dir = PROFILE_DIR / "Default"
    if default_dir.exists():
        for f in default_dir.glob("*Cookie*"):
            try:
                if f.is_file():
                    f.unlink()
                    deleted_items.append(f.name)
            except Exception as e:
                print(f"Error removing {f}: {e}")

    # Also remove session storage if needed
    session_storage = default_dir / "Session Storage"
    if session_storage.exists():
        try:
            shutil.rmtree(session_storage)
            deleted_items.append("Session Storage")
        except Exception:
            pass

    return {
        "status": "cleared",
        "message": f"Đã xóa sạch phiên đăng nhập ({len(deleted_items)} mục). Bạn có thể đăng nhập acc mới!",
        "cleared_items": deleted_items
    }


if __name__ == "__main__":
    print("Testing session manager...")
    st = get_session_status()
    print("Status:", json.dumps(st, indent=2, ensure_ascii=False))
