"""
FLM TV — Schedule Page Updater
================================
Reads a JSON file exported from the FLM Scheduler and injects
the new schedule data into schedule.html.

Usage:
    python update_schedule.py <input.json> [schedule.html]

If schedule.html path is omitted it looks for schedule.html
in the same folder as this script.

The JSON must be in the format the FLM Scheduler exports:
{
  "2026-05-15": [
    {"startTime":"HH:MM", "name":"...", "path":"...",
     "duration": 1234, "inPoint": 0, "outPoint": 1234, "category":""},
    ...
  ],
  "2026-05-16": [ ... ]
}

Run this script from Desktop, then upload/push schedule.html to GitHub.
"""

import sys, json, re, os, shutil
from datetime import datetime

def die(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)

def main():
    # ── args ──────────────────────────────────────────────────
    if len(sys.argv) < 2:
        die("Usage: python update_schedule.py <FLM-TV-Schedule.json> [schedule.html]")

    json_path = sys.argv[1]
    if not os.path.exists(json_path):
        die(f"JSON file not found: {json_path}")

    if len(sys.argv) >= 3:
        html_path = sys.argv[2]
    else:
        html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schedule.html")

    if not os.path.exists(html_path):
        die(f"schedule.html not found: {html_path}")

    # ── load new schedule ──────────────────────────────────────
    with open(json_path, 'r', encoding='utf-8') as f:
        new_data = json.load(f)

    if not isinstance(new_data, dict):
        die("JSON must be an object with date keys like '2026-05-15'")

    # ── load html ─────────────────────────────────────────────
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # ── extract existing SCHEDULE_JSON ────────────────────────
    match = re.search(r'(const SCHEDULE_JSON\s*=\s*)(\{.*?\})(\s*;)', html, re.DOTALL)
    if not match:
        die("Could not find 'const SCHEDULE_JSON = {...}' in schedule.html")

    try:
        existing = json.loads(match.group(2))
    except json.JSONDecodeError as e:
        die(f"Could not parse existing SCHEDULE_JSON: {e}")

    # ── merge: new dates override existing ────────────────────
    merged = {**existing, **new_data}

    # Keep only the 14 most recent date keys to keep file lean
    all_dates = sorted(merged.keys())
    if len(all_dates) > 14:
        for old_key in all_dates[:-14]:
            del merged[old_key]
        print(f"  Trimmed old dates, kept {len(merged)} days")

    # ── rebuild html ──────────────────────────────────────────
    new_json_str = json.dumps(merged, ensure_ascii=False, indent=2)
    new_html = html[:match.start(2)] + new_json_str + html[match.end(2):]

    # ── backup original ───────────────────────────────────────
    backup = html_path + ".bak"
    shutil.copy2(html_path, backup)
    print(f"  Backed up original → {backup}")

    # ── write ─────────────────────────────────────────────────
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)

    added = list(new_data.keys())
    print(f"\n✅  schedule.html updated!")
    print(f"   Added/replaced dates: {', '.join(added)}")
    print(f"   Total dates in file:  {len(merged)}")
    print(f"\n   Upload schedule.html to GitHub to go live.")

if __name__ == "__main__":
    main()
