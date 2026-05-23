"""
FLM TV Schedule Updater
-----------------------
Reads FLM-TV-Schedule.json exported from the FLM Master Scheduler
and injects the schedule data into schedule.html

Run via Update-FLM-Schedule.bat
"""

import json, re, sys, os, shutil
from datetime import datetime

# ── FILE PATHS ──────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
JSON_FILE    = os.path.join(SCRIPT_DIR, "FLM-TV-Schedule.json")
HTML_FILE    = os.path.join(SCRIPT_DIR, "schedule.html")
BACKUP_FILE  = os.path.join(SCRIPT_DIR, "schedule.html.bak")

# ── CATEGORY MAP ────────────────────────────────────────────────────────
def get_cat(item):
    c = (item.get("category") or item.get("cat") or "").lower()
    if c in ("commercial","ad"):       return "ad"
    if c == "movie":                   return "movie"
    if c == "kids":                    return "kids"
    if c == "flm":                     return "flm"
    return "show"

# ── LOAD JSON ───────────────────────────────────────────────────────────
def load_schedule():
    if not os.path.exists(JSON_FILE):
        print(f"\n  ERROR: Cannot find {JSON_FILE}")
        print("  Export your schedule from the FLM Master Scheduler as JSON first.")
        input("\n  Press Enter to close...")
        sys.exit(1)

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Support two formats:
    # 1. Flat list: [{startTime, name, duration, category}, ...]
    # 2. Date-keyed: {"2026-05-23": [...]}
    items = []
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        today = datetime.now().strftime("%Y-%m-%d")
        if today in data:
            items = data[today]
        else:
            # Use the most recent date key
            keys = sorted(data.keys(), reverse=True)
            for k in keys:
                if isinstance(data[k], list):
                    items = data[k]
                    print(f"  Note: Using date key '{k}' (today '{today}' not found)")
                    break

    if not items:
        print("  ERROR: No schedule items found in JSON file.")
        input("\n  Press Enter to close...")
        sys.exit(1)

    return items

# ── BUILD JS ARRAY ──────────────────────────────────────────────────────
def build_js(items):
    lines = []
    for item in items:
        t   = item.get("startTime") or item.get("t") or "00:00"
        n   = (item.get("name") or item.get("n") or "Unknown").replace("'", "\\'")
        d   = int(item.get("duration") or item.get("d") or 0)
        cat = get_cat(item)
        lines.append(f"  {{t:\"{t}\",n:\"{n}\",d:{d},cat:\"{cat}\"}}")

    return "const TODAY_SCHEDULE = [\n" + ",\n".join(lines) + "\n];"

# ── INJECT INTO HTML ────────────────────────────────────────────────────
def inject(js_block):
    if not os.path.exists(HTML_FILE):
        print(f"\n  ERROR: Cannot find {HTML_FILE}")
        input("\n  Press Enter to close...")
        sys.exit(1)

    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html = f.read()

    pattern = r"const TODAY_SCHEDULE = \[[\s\S]*?\];"
    if not re.search(pattern, html):
        print("  ERROR: Could not find TODAY_SCHEDULE in schedule.html.")
        print("  Make sure you are using the correct schedule.html file.")
        input("\n  Press Enter to close...")
        sys.exit(1)

    # Backup
    shutil.copy(HTML_FILE, BACKUP_FILE)
    print(f"  Backup saved: schedule.html.bak")

    new_html = re.sub(pattern, js_block, html)

    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(new_html)

    print(f"  schedule.html updated successfully!")

# ── MAIN ────────────────────────────────────────────────────────────────
def main():
    print()
    print("  ==========================================")
    print("    FLM TV — Schedule Updater")
    print("  ==========================================")
    print()

    items = load_schedule()
    print(f"  Loaded {len(items)} items from FLM-TV-Schedule.json")

    js_block = build_js(items)
    inject(js_block)

    print()
    print(f"  Done! {len(items)} items injected into schedule.html")
    print()
    print("  Upload schedule.html to your site to go live.")
    print()

    # Optional GitHub push
    ans = input("  Push to GitHub now? (y/n): ").strip().lower()
    if ans == "y":
        os.system('cd /d "%s" && git add schedule.html && git commit -m "Schedule update %s" && git push' % (
            SCRIPT_DIR, datetime.now().strftime("%Y-%m-%d %H:%M")
        ))
        print("  Pushed to GitHub!")

    print()
    input("  Press Enter to close...")

if __name__ == "__main__":
    main()
