#!/usr/bin/env python3
"""
FLM TV - Roku Direct Publisher Feed Generator
Pulls content from Jellyfin and generates a Roku-compatible JSON feed.
Save this file and run it whenever you want to refresh your Roku feed.
"""

import json
import requests
import urllib.parse
from datetime import datetime

# ============================================================
# FLM TV CONFIGURATION
# ============================================================
JELLYFIN_SERVER = "https://flmtv26.duckdns.org:8920"
API_KEY = "62131ee22c0141c6b651be75a7444350"
USER_ID = "0407d4609a0346f99c09e0d7ddc9ccd1"

# Your libraries - name and Jellyfin ID
LIBRARIES = [
    {"id": "adf5c3d30aa8572dcb64577f4ae6b105", "name": "Movies 1",          "type": "movies"},
    {"id": "6fcfa6221b9a5741d5fdcf30f78f946b", "name": "Movies 2",          "type": "movies"},
    {"id": "5ff2dc76882e099b56c555f868f29abe", "name": "Asian Cinema",       "type": "movies"},
    {"id": "e5da6f90a5fbe74163d22de1b0014943", "name": "Golden Classics",    "type": "movies"},
    {"id": "9eb72a50280cf3ef5599f4c43a383611", "name": "Tagalog Films",      "type": "movies"},
    {"id": "c71a54b70069a28e508358fa66e2a286", "name": "International Films","type": "movies"},
    {"id": "cf6b0d096a1b570653b5a9a572fefa9b", "name": "Awesome TV",         "type": "series"},
    {"id": "ede598bcd27f80ea256af569dc7ac4a6", "name": "Classic TV",         "type": "series"},
    {"id": "ca43f3291c81d4f007f2b33936d256e6", "name": "Kids World",         "type": "series"},
    {"id": "eaddf6d7a354f68f5f1c6ff947baf506", "name": "Filipina TV",        "type": "series"},
    {"id": "5f2f2ace0732efb63f625d1346b9c766", "name": "Zaina Zone",         "type": "series"},
    {"id": "5ed2753fb759a28245f2a4cb6dc2f4fd", "name": "Comedy",             "type": "series"},
    {"id": "56f8dc1075207592d3248a09358c587a", "name": "Documentaries",      "type": "series"},
]

HEADERS = {"X-Emby-Token": API_KEY}
MAX_ITEMS_PER_LIBRARY = 50  # Roku recommends keeping feeds manageable

# ============================================================

def get_stream_url(item_id):
    """Build a direct stream URL for a Jellyfin item."""
    return (
        f"{JELLYFIN_SERVER}/Videos/{item_id}/stream"
        f"?static=true&api_key={API_KEY}"
    )

def get_thumbnail_url(item_id, img_type="Primary"):
    """Build a thumbnail URL for a Jellyfin item."""
    return (
        f"{JELLYFIN_SERVER}/Items/{item_id}/Images/{img_type}"
        f"?api_key={API_KEY}&quality=90&width=800"
    )

def fetch_items(library_id, item_type="Movie"):
    """Fetch items from a Jellyfin library."""
    url = f"{JELLYFIN_SERVER}/Users/{USER_ID}/Items"
    params = {
        "ParentId": library_id,
        "IncludeItemTypes": item_type,
        "Recursive": "true",
        "Fields": "Overview,Genres,ProductionYear,RunTimeTicks,People",
        "Limit": MAX_ITEMS_PER_LIBRARY,
        "SortBy": "SortName",
        "SortOrder": "Ascending",
        "api_key": API_KEY,
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, verify=False, timeout=30)
        resp.raise_for_status()
        return resp.json().get("Items", [])
    except Exception as e:
        print(f"  ⚠️  Could not fetch library {library_id}: {e}")
        return []

def ticks_to_seconds(ticks):
    """Convert Jellyfin ticks to seconds."""
    if ticks:
        return int(ticks / 10_000_000)
    return 0

def make_movie_entry(item, category):
    """Build a Roku movie entry from a Jellyfin item."""
    item_id = item.get("Id", "")
    title = item.get("Name", "Untitled")
    overview = item.get("Overview", "")[:500] if item.get("Overview") else "Available on FLM Television Network."
    year = item.get("ProductionYear", "")
    duration = ticks_to_seconds(item.get("RunTimeTicks"))
    genres = [g.lower() for g in item.get("Genres", [])][:3]
    if not genres:
        genres = ["drama"]

    thumbnail = get_thumbnail_url(item_id)
    stream_url = get_stream_url(item_id)

    entry = {
        "id": f"flm-{item_id}",
        "title": title,
        "shortDescription": overview[:200],
        "longDescription": overview,
        "thumbnail": thumbnail,
        "releaseDate": f"{year}-01-01" if year else "2000-01-01",
        "genres": genres,
        "tags": ["FLM TV", category],
        "content": {
            "dateAdded": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "videos": [
                {
                    "url": stream_url,
                    "quality": "FHD",
                    "videoType": "MP4"
                }
            ],
            "duration": duration if duration > 0 else 5400,
            "language": "en"
        }
    }
    if year:
        entry["releaseDate"] = f"{year}-01-01"

    return entry

def make_series_entry(item, category):
    """Build a Roku series entry from a Jellyfin TV show."""
    item_id = item.get("Id", "")
    title = item.get("Name", "Untitled")
    overview = item.get("Overview", "")[:500] if item.get("Overview") else "Available on FLM Television Network."
    year = item.get("ProductionYear", "")
    genres = [g.lower() for g in item.get("Genres", [])][:3]
    if not genres:
        genres = ["drama"]

    thumbnail = get_thumbnail_url(item_id)

    return {
        "id": f"flm-{item_id}",
        "title": title,
        "shortDescription": overview[:200],
        "longDescription": overview,
        "thumbnail": thumbnail,
        "releaseDate": f"{year}-01-01" if year else "2000-01-01",
        "genres": genres,
        "tags": ["FLM TV", category],
        "seasons": [
            {
                "seasonNumber": 1,
                "episodes": [
                    {
                        "id": f"flm-ep-{item_id}-1",
                        "title": f"{title} - Episode 1",
                        "content": {
                            "dateAdded": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "videos": [
                                {
                                    "url": get_stream_url(item_id),
                                    "quality": "FHD",
                                    "videoType": "MP4"
                                }
                            ],
                            "duration": 1800,
                            "language": "en"
                        },
                        "thumbnail": thumbnail,
                        "releaseDate": f"{year}-01-01" if year else "2000-01-01",
                        "episodeNumber": 1,
                        "shortDescription": overview[:200],
                    }
                ]
            }
        ]
    }

def generate_feed():
    print("🎬 FLM TV - Roku Feed Generator")
    print("=" * 50)

    all_movies = []
    all_series = []

    for lib in LIBRARIES:
        print(f"\n📂 Fetching: {lib['name']} ...")

        if lib["type"] == "movies":
            items = fetch_items(lib["id"], "Movie")
            print(f"   Found {len(items)} movies")
            for item in items:
                try:
                    entry = make_movie_entry(item, lib["name"])
                    all_movies.append(entry)
                except Exception as e:
                    print(f"   ⚠️  Skipped {item.get('Name','?')}: {e}")

        elif lib["type"] == "series":
            items = fetch_items(lib["id"], "Series")
            print(f"   Found {len(items)} series")
            for item in items:
                try:
                    entry = make_series_entry(item, lib["name"])
                    all_series.append(entry)
                except Exception as e:
                    print(f"   ⚠️  Skipped {item.get('Name','?')}: {e}")

    # Build the final Roku feed
    feed = {
        "providerName": "FLM Television Network",
        "lastUpdated": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "language": "en",
        "rating": [
            {
                "rating": "G",
                "ratingSource": "MPAA"
            }
        ]
    }

    if all_movies:
        feed["movies"] = all_movies
        print(f"\n✅ Total movies: {len(all_movies)}")

    if all_series:
        feed["series"] = all_series
        print(f"✅ Total series: {len(all_series)}")

    # Save the feed
    output_file = "flmtv_roku_feed.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(feed, f, indent=2, ensure_ascii=False)

    print(f"\n🎉 Feed saved to: {output_file}")
    print(f"   Movies: {len(all_movies)}")
    print(f"   Series: {len(all_series)}")
    print("\n📋 NEXT STEP:")
    print("   Upload flmtv_roku_feed.json to your website")
    print("   Then submit the URL to Roku Direct Publisher")

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings()
    generate_feed()
