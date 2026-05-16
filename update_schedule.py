"""
FLM TV - Schedule Page Updater
================================
Accepts EITHER:
  - JSON exported from the FLM Scheduler
  - M3U playlist exported from vMix

Usage:
    python update_schedule.py <input.json|input.m3u> [schedule.html] [--date YYYY-MM-DD] [--start HH:MM]

Examples:
    python update_schedule.py FLM-TV-Schedule.json schedule.html
    python update_schedule.py FLM-TV-Schedule.m3u  schedule.html
    python update_schedule.py playlist.m3u schedule.html --date 2026-05-17 --start 08:00
"""

import sys, json, re, os, shutil, subprocess
from datetime import datetime, date

def die(msg):
    print(f"\n  ERROR: {msg}")
    input("\n  Press Enter to close...")
    sys.exit(1)

def clean_name(filename):
    name = os.path.splitext(filename)[0]
    name = re.sub(r'\.ia$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[\.\s](720p|1080p|2160p|4k|BluRay|BRRip|WEB-DL|WEBRip|HDTV|DVDRip|x264|x265|HEVC|AAC|AVC).*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[._]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def detect_category(path):
    p = path.replace('\\', '/').upper()
    fname = os.path.basename(path).upper()
    commercial_names = ['LANCE4JUDGE','JUDGEMARYPERRY','LENNA4NV','LANCE HENDRON',
                        'MARYPERRY','MARYPERRYH','SNAIL-LOGO','SNAIL_LOGO',
                        'BOXER','SHEBOUJAY','LANCE_HENDRON']
    commercial_paths = ['COMMERCIAL','CLIPS','FILLER']
    if any(x in fname for x in commercial_names): return 'commercial'
    if any(x in p for x in commercial_paths): return 'commercial'
    kids_paths = ['KIDS WORLD','KIDS-WORLD','KIDS_WORLD','CARTOON','ANIME',
                  'SESAME','SUPER WHY','SCHOOLHOUSE','FIREMAN SAM']
    if any(x in p for x in kids_paths): return 'kids'
    flm_paths = ['ZAINA','SPOTLIGHT','LOCALS IN LAS VEGAS','VEGAS SPOTLIGHT']
    if any(x in p for x in flm_paths): return 'flm'
    return ''

def get_duration_ffprobe(filepath):
    candidates = ['ffprobe',
                  r'C:\Program Files (x86)\vMix\ffprobe.exe',
                  r'C:\Program Files\vMix\ffprobe.exe',
                  r'C:\ffmpeg\bin\ffprobe.exe',
                  r'C:\tools\ffmpeg\bin\ffprobe.exe']
    for cmd in candidates:
        try:
            result = subprocess.run(
                [cmd, '-v', 'quiet', '-print_format', 'json', '-show_format', filepath],
                capture_output=True, text=True, timeout=15)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return int(float(data['format']['duration']))
        except: continue
    return 0

def parse_m3u(m3u_path, target_date, start_hhmm):
    print(f"\n  Reading M3U: {os.path.basename(m3u_path)}")
    paths = []
    with open(m3u_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip().strip('"').strip("'")
            if not line or line.startswith('#'):
                continue
            paths.append(line)

    if not paths:
        die("No file paths found in M3U file.")

    print(f"  Found {len(paths)} entries")

    # Test if ffprobe works
    first_exists = os.path.exists(paths[0])
    test_dur = get_duration_ffprobe(paths[0]) if first_exists else -1
    has_ffprobe = first_exists and (test_dur >= 0)

    if not has_ffprobe:
        print("\n  WARNING: ffprobe not found or files not accessible from this machine.")
        print("  Durations will be 0 - times on schedule page will not be accurate.")
        print("  TIP: Run this on Computer 1 where the files are stored.")
        input("\n  Press Enter to continue anyway (or Ctrl+C to cancel)...")

    sh, sm = map(int, start_hhmm.split(':'))
    current_sec = sh * 3600 + sm * 60
    entries = []
    total = len(paths)

    for i, path in enumerate(paths):
        filename = os.path.basename(path)
        name = clean_name(filename)
        category = detect_category(path)

        if has_ffprobe:
            duration = get_duration_ffprobe(path)
            if i % 10 == 0 or i == total - 1:
                print(f"  [{i+1}/{total}] {filename[:60]}")
        else:
            duration = 0

        h = (current_sec // 3600) % 24
        m = (current_sec % 3600) // 60
        start_time = f"{h:02d}:{m:02d}"

        entries.append({
            "startTime": start_time,
            "name": name,
            "path": filename,
            "duration": duration,
            "inPoint": 0,
            "outPoint": duration,
            "category": category
        })
        current_sec += duration

    return {target_date: entries}

def parse_json_file(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data, dict):
        die("JSON must be an object with date keys like '2026-05-16'")
    return data

def update_html(html_path, new_data):
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    match = re.search(r'(const SCHEDULE_JSON\s*=\s*)(\{.*?\})(\s*;)', html, re.DOTALL)
    if not match:
        die("Could not find 'const SCHEDULE_JSON = {...}' in schedule.html")

    try:
        existing = json.loads(match.group(2))
    except json.JSONDecodeError as e:
        die(f"Could not parse existing SCHEDULE_JSON: {e}")

    merged = {**existing, **new_data}
    all_dates = sorted(merged.keys())
    if len(all_dates) > 14:
        for old_key in all_dates[:-14]:
            del merged[old_key]
        print(f"  Trimmed old dates, kept {len(merged)}")

    new_json_str = json.dumps(merged, ensure_ascii=False, indent=2)
    new_html = html[:match.start(2)] + new_json_str + html[match.end(2):]

    backup = html_path + ".bak"
    shutil.copy2(html_path, backup)
    print(f"  Backed up -> {os.path.basename(backup)}")

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)

    return merged

def main():
    args = sys.argv[1:]
    if not args:
        die("Usage: python update_schedule.py <file.json|file.m3u> [schedule.html] [--date YYYY-MM-DD] [--start HH:MM]")

    input_path = args[0]
    if not os.path.exists(input_path):
        die(f"Input file not found: {input_path}")

    html_path = None
    date_arg = None
    start_arg = None
    i = 1
    while i < len(args):
        if args[i] == '--date' and i+1 < len(args):
            date_arg = args[i+1]; i += 2
        elif args[i] == '--start' and i+1 < len(args):
            start_arg = args[i+1]; i += 2
        elif not args[i].startswith('--'):
            html_path = args[i]; i += 1
        else:
            i += 1

    if not html_path:
        html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schedule.html")
    if not os.path.exists(html_path):
        die(f"schedule.html not found: {html_path}")

    ext = os.path.splitext(input_path)[1].lower()

    if ext == '.m3u':
        if date_arg:
            target_date = date_arg
        else:
            today_str = date.today().strftime('%Y-%m-%d')
            ans = input(f"\n  Date for this schedule [{today_str}]: ").strip()
            target_date = ans if ans else today_str

        if start_arg:
            start_time = start_arg
        else:
            start_time = input("  Start time for first item (HH:MM e.g. 08:00): ").strip()
            if not start_time:
                start_time = "08:00"

        if not re.match(r'^\d{1,2}:\d{2}$', start_time):
            die(f"Invalid time: {start_time}. Use HH:MM")

        new_data = parse_m3u(input_path, target_date, start_time)

    elif ext == '.json':
        new_data = parse_json_file(input_path)

    else:
        die(f"Unsupported file: {ext}\nOnly .json and .m3u are supported.")

    merged = update_html(html_path, new_data)
    added = list(new_data.keys())
    total_shows = sum(len(v) for v in new_data.values())

    print(f"\n  SUCCESS - schedule.html updated!")
    print(f"  Type    : {ext.upper()}")
    print(f"  Date(s) : {', '.join(added)}")
    print(f"  Shows   : {total_shows}")
    print(f"  Total dates in file: {len(merged)}")
    print(f"\n  Push schedule.html to GitHub to go live.")

if __name__ == "__main__":
    main()
