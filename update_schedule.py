"""
FLM TV Schedule Updater
-----------------------
Reads FLM-TV-Schedule.json exported from the FLM Master Scheduler
and injects OR APPENDS the schedule data into schedule.html

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
    return ""

# ── LOAD JSON ───────────────────────────────────────────────────────────
def load_schedule():
    if not os.path.exists(JSON_FILE):
        print(f"\n  ERROR: Cannot find {JSON_FILE}")
        print("  Export your schedule from the FLM Master Scheduler as JSON first.")
        input("\n  Press Enter to close...")
        sys.exit(1)

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = []
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        today = datetime.now().strftime("%Y-%m-%d")
        if today in data:
            items = data[today]
        else:
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

# ── BUILD JS ENTRY ──────────────────────────────────────────────────────
def item_to_js(item):
    t   = item.get("startTime") or item.get("t") or "00:00"
    n   = (item.get("name") or item.get("n") or "Unknown").replace("'", "\\'")
    d   = int(item.get("duration") or item.get("d") or 0)
    cat = get_cat(item)
    date = item.get("date") or item.get("airDate") or ""
    if date:
        return f'  {{t:"{t}",n:"{n}",d:{d},cat:"{cat}",date:"{date}"}}'
    return f'  {{t:"{t}",n:"{n}",d:{d},cat:"{cat}"}}'

# ── GET EXISTING SCHEDULE FROM HTML ────────────────────────────────────
def get_existing_items(html):
    match = re.search(r'const TODAY_SCHEDULE = \[([\s\S]*?)\];', html)
    if not match:
        return []
    block = match.group(1)
    items = []
    # Match entries with or without trailing date field
    for m in re.finditer(r'\{t:"([^"]+)",n:"([^"]+)",d:(\d+),cat:"([^"]*)"(?:,date:"([^"]*)")?\}', block):
        entry = {"t": m.group(1), "n": m.group(2), "d": int(m.group(3)), "cat": m.group(4)}
        if m.group(5):
            entry["date"] = m.group(5)
        items.append(entry)
    return items

# ── INJECT INTO HTML ────────────────────────────────────────────────────
def inject(js_block, html):
    pattern = r"const TODAY_SCHEDULE = \[[\s\S]*?\];"
    if not re.search(pattern, html):
        print("  ERROR: Could not find TODAY_SCHEDULE in schedule.html.")
        input("\n  Press Enter to close...")
        sys.exit(1)
    return re.sub(pattern, js_block, html)

# ── MAIN ────────────────────────────────────────────────────────────────
def main():
    print()
    print("  ==========================================")
    print("    FLM TV — Schedule Updater")
    print("  ==========================================")
    print()
    print("  Choose mode:")
    print("  [1] APPEND  — Add new shows after last show in current schedule")
    print("  [2] REPLACE — Replace entire schedule with new JSON")
    print()
    mode = input("  Enter 1 or 2: ").strip()

    if mode not in ("1", "2"):
        print("  Invalid choice. Exiting.")
        input("\n  Press Enter to close...")
        sys.exit(1)

    new_items = load_schedule()
    print(f"\n  Loaded {len(new_items)} items from FLM-TV-Schedule.json")

    if not os.path.exists(HTML_FILE):
        print(f"\n  ERROR: Cannot find {HTML_FILE}")
        input("\n  Press Enter to close...")
        sys.exit(1)

    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html = f.read()

    if mode == "1":
        # APPEND MODE — keep existing, add new after last entry
        existing = get_existing_items(html)
        print(f"  Found {len(existing)} existing items in schedule.html")
        new_converted = [{"t": i.get("startTime") or i.get("t","00:00"),
                          "n": (i.get("name") or i.get("n","")).replace("'","\\'"),
                          "d": int(i.get("duration") or i.get("d",0)),
                          "cat": get_cat(i),
                          "date": i.get("date") or i.get("airDate") or ""} for i in new_items]
        combined = existing + new_converted
        lines = [item_to_js(i) for i in combined]
        js_block = "const TODAY_SCHEDULE = [\n" + ",\n".join(lines) + "\n];"
        total = len(combined)
        print(f"  Combined total: {total} items")
    else:
        # REPLACE MODE
        lines = [item_to_js(i) for i in new_items]
        js_block = "const TODAY_SCHEDULE = [\n" + ",\n".join(lines) + "\n];"
        total = len(new_items)

    # Backup and write
    shutil.copy(HTML_FILE, BACKUP_FILE)
    print(f"  Backup saved: schedule.html.bak")

    new_html = inject(js_block, html)
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(new_html)

    print(f"\n  Done! {total} items in schedule.html")
    print()
    print("  Upload schedule.html to your site to go live.")
    print()

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
