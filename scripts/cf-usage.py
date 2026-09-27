#!/usr/bin/env python3
"""Usage report for the ContextFlow collaboration worker on Cloudflare.

Answers "is anyone using the cloud instance?" from Cloudflare's side:
how many shared-project rooms exist (Durable Objects with stored data),
how much they store, and how much traffic the worker and its rooms saw.

Auth reuses the wrangler OAuth login (run `npx wrangler login` if it has expired).

Usage:
  scripts/cf-usage.py               # production, last 30 days
  scripts/cf-usage.py --days 90
  scripts/cf-usage.py --staging
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.request
from pathlib import Path

ACCOUNT_ID = "1620fddfe54aeddfc89ea9b18976c2ca"
API = "https://api.cloudflare.com/client/v4"
WRANGLER_CONFIG = Path.home() / "Library/Preferences/.wrangler/config/default.toml"
SCRIPTS = {"production": "contextflow-collab", "staging": "contextflow-collab-staging"}
DEFAULT_DAYS = 30
MAX_DAYS = 31  # Cloudflare analytics rejects ranges wider than 4 weeks 4 days on this plan
PAGE_LIMIT = 1000
MICROSECONDS_PER_SECOND = 1_000_000
BUILT_IN_ROOMS = 3  # acme-ecommerce, cbioportal, elan-warranty share one global room each


def read_wrangler_token() -> str:
    for line in WRANGLER_CONFIG.read_text().splitlines():
        if line.startswith("oauth_token"):
            return line.split('"')[1]
    sys.exit("No wrangler OAuth token found; run `npx wrangler login`.")


def api_get(token: str, path: str) -> dict:
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        body = json.load(resp)
    if not body.get("success"):
        sys.exit(f"API error on {path}: {body.get('errors')}")
    return body


def graphql(token: str, query: str) -> dict:
    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        f"{API}/graphql",
        data=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        body = json.load(resp)
    if body.get("errors"):
        sys.exit(f"GraphQL error: {body['errors']}")
    return body["data"]["viewer"]["accounts"][0]


def find_namespace(token: str, script: str) -> str:
    namespaces = api_get(token, f"/accounts/{ACCOUNT_ID}/workers/durable_objects/namespaces")["result"]
    for ns in namespaces:
        if ns.get("script") == script and ns.get("class") == "YjsRoom":
            return ns["id"]
    sys.exit(f"No YjsRoom namespace for {script}")


def count_rooms(token: str, namespace_id: str) -> tuple[int, int]:
    total = with_data = 0
    cursor = ""
    while True:
        path = f"/accounts/{ACCOUNT_ID}/workers/durable_objects/namespaces/{namespace_id}/objects?limit={PAGE_LIMIT}"
        if cursor:
            path += f"&cursor={cursor}"
        body = api_get(token, path)
        for obj in body["result"]:
            total += 1
            if obj.get("hasStoredData"):
                with_data += 1
        cursor = (body.get("result_info") or {}).get("cursor") or ""
        if not cursor:
            return total, with_data


def daily_traffic(token: str, script: str, namespace_id: str, since: str) -> list[dict]:
    query = f"""{{ viewer {{ accounts(filter: {{accountTag: "{ACCOUNT_ID}"}}) {{
      workersInvocationsAdaptive(limit: 400, orderBy: [date_ASC],
        filter: {{datetime_geq: "{since}", scriptName: "{script}"}}) {{
        dimensions {{ date }} sum {{ requests errors }} }}
      durableObjectsInvocationsAdaptiveGroups(limit: 400, orderBy: [date_ASC],
        filter: {{datetime_geq: "{since}", scriptName: "{script}"}}) {{
        dimensions {{ date }} sum {{ requests errors wallTime }} }}
      durableObjectsPeriodicGroups(limit: 400, orderBy: [date_ASC],
        filter: {{date_geq: "{since[:10]}", namespaceId: "{namespace_id}"}}) {{
        dimensions {{ date }} sum {{ activeTime }} }}
    }} }} }}"""
    data = graphql(token, query)
    worker = {row["dimensions"]["date"]: row["sum"] for row in data["workersInvocationsAdaptive"]}
    rooms = {row["dimensions"]["date"]: row["sum"] for row in data["durableObjectsInvocationsAdaptiveGroups"]}
    active = {row["dimensions"]["date"]: row["sum"]["activeTime"] for row in data["durableObjectsPeriodicGroups"]}
    days = sorted(set(worker) | set(rooms))
    rows = [
        {
            "date": day,
            "worker_requests": worker.get(day, {}).get("requests", 0),
            "room_requests": rooms.get(day, {}).get("requests", 0),
            "room_active_s": round(active.get(day, 0) / MICROSECONDS_PER_SECOND),
            "disconnects": rooms.get(day, {}).get("errors", 0),
        }
        for day in days
    ]
    return rows


def print_report(env: str, script: str, days: int, rooms: tuple[int, int], rows: list[dict]) -> None:
    total_rooms, rooms_with_data = rooms
    active_days = sum(1 for r in rows if r["worker_requests"] > 0)
    total_worker = sum(r["worker_requests"] for r in rows)
    total_room = sum(r["room_requests"] for r in rows)
    total_active_s = sum(r["room_active_s"] for r in rows)
    total_disconnects = sum(r["disconnects"] for r in rows)
    print(f"ContextFlow collab worker usage: {env} ({script}), last {days} days")
    print()
    print("  Every project is cloud-first, so a room is any project that was ever opened in a browser,")
    print(f"  not only shared ones. {BUILT_IN_ROOMS} of them are the built-in samples, which all visitors share.")
    print()
    print(f"  rooms (projects) total:         {total_rooms}")
    print(f"  rooms holding a saved doc:      {rooms_with_data}")
    print(f"  days with any traffic:          {active_days} of {len(rows)}")
    print(f"  worker requests (connections):  {total_worker}")
    print(f"  room (Durable Object) requests: {total_room}")
    print(f"  room active time:               {total_active_s} s (what Cloudflare bills as duration)")
    print(f"  websocket disconnects:          {total_disconnects} (tabs closing; Cloudflare files these under errors)")
    print()
    print("  date        connections  room-requests  room-active-s  disconnects")
    for r in rows:
        print(f"  {r['date']}  {r['worker_requests']:>11}  {r['room_requests']:>13}  {r['room_active_s']:>13}  {r['disconnects']:>11}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, default=DEFAULT_DAYS, help=f"1..{MAX_DAYS}; the analytics API caps the range")
    parser.add_argument("--staging", action="store_true", help="report on the staging worker instead of production")
    args = parser.parse_args()

    if not 1 <= args.days <= MAX_DAYS:
        sys.exit(f"--days must be between 1 and {MAX_DAYS} (Cloudflare analytics range cap)")
    env = "staging" if args.staging else "production"
    script = SCRIPTS[env]
    token = read_wrangler_token()
    since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=args.days)).strftime("%Y-%m-%dT00:00:00Z")

    namespace_id = find_namespace(token, script)
    rooms = count_rooms(token, namespace_id)
    rows = daily_traffic(token, script, namespace_id, since)
    print_report(env, script, args.days, rooms, rows)


if __name__ == "__main__":
    main()
