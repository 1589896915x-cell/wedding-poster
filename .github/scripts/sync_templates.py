"""Sync changed template URLs using the workflow's existing Supabase secrets.

Only templates 63–76 receive embedded metadata updates. Older templates retain
their existing update payload, including any manually maintained cover image.
"""

import argparse
import base64
import binascii
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlsplit
from urllib.request import Request, urlopen


NEW_IDS = range(63, 77)
TEMPLATE_FILE = re.compile(r"(?:[0-9]+|template-[^/\\]+)\.html\Z")
DEFINITION = re.compile(r"<script\b[^>]*>\s*window\.TEMPLATE\s*=\s*", re.I)
COVER = re.compile(r"data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)\Z")


class SyncError(RuntimeError):
    """An actionable, credential-free sync failure."""


def embedded_metadata(file):
    """Read JSON, never execute JavaScript or infer the database id."""
    if not file.stem.isdecimal() or int(file.stem) not in NEW_IDS:
        return None
    source = file.read_text(encoding="utf-8-sig")
    matches = list(DEFINITION.finditer(source))
    if len(matches) != 1:
        raise SyncError(f"{file.name}: expected one embedded window.TEMPLATE")
    try:
        definition, _ = json.JSONDecoder().raw_decode(source, matches[0].end())
    except json.JSONDecodeError:
        raise SyncError(f"{file.name}: embedded definition is not valid JSON") from None
    if not isinstance(definition, dict):
        raise SyncError(f"{file.name}: embedded definition must be an object")
    ident = int(file.stem)
    if definition.get("id") != ident or definition.get("refIndex") != ident - 62:
        raise SyncError(f"{file.name}: template/reference number mismatch")
    name, role, cover = (definition.get(k) for k in ("name", "role", "referenceDataUrl"))
    if not isinstance(name, str) or not name.strip() or role not in {"封面", "拼图", "服务说明"}:
        raise SyncError(f"{file.name}: missing name or supported role")
    match = COVER.fullmatch(cover) if isinstance(cover, str) else None
    if not match or len(cover) > 3_000_000:
        raise SyncError(f"{file.name}: missing or oversized reference cover")
    try:
        decoded = base64.b64decode(match[2], validate=True)
    except binascii.Error:
        raise SyncError(f"{file.name}: invalid reference cover encoding") from None
    valid_signature = {
        "jpeg": decoded.startswith(b"\xff\xd8\xff"),
        "png": decoded.startswith(b"\x89PNG\r\n\x1a\n"),
        "webp": decoded.startswith(b"RIFF") and decoded[8:12] == b"WEBP",
    }[match[1]]
    if not valid_signature:
        raise SyncError(f"{file.name}: reference cover is not the declared image type")
    return {"name": name.strip(), "role": role, "refIndex": definition["refIndex"], "referenceDataUrl": cover}


def selected_templates(repo, changed):
    selected = {p for p in changed if TEMPLATE_FILE.fullmatch(p)}
    return sorted((repo / name for name in selected if (repo / name).is_file()), key=lambda p: p.name)


def requested_templates(repo, value):
    """Manual inputs are data, and may name only the explicitly authorized batch."""
    names = value.split()
    if not names or len(names) > 14 or len(names) != len(set(names)):
        raise SyncError("Manual files must contain 1–14 unique template filenames")
    if any(not re.fullmatch(r"(?:6[3-9]|7[0-6])\.html", name) for name in names):
        raise SyncError("Manual files may only contain 63.html through 76.html")
    files = [repo / name for name in names]
    if any(not file.is_file() for file in files):
        raise SyncError("A requested template file is missing from the checked-out commit")
    return files


def git_changed(repo):
    commands = [
        ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
        ["git", "show", "--name-only", "--format=", "HEAD"],
    ]
    for command in commands:
        result = subprocess.run(command, cwd=repo, capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.splitlines()
    raise SyncError("Cannot determine changed template files from Git")


class SupabaseClient:
    def __init__(self, base_url, api_key, opener=urlopen):
        if urlsplit(base_url).scheme != "https" or not urlsplit(base_url).netloc:
            raise SyncError("SB_URL must be an HTTPS project URL")
        if not api_key:
            raise SyncError("SB_KEY is required")
        self.endpoint = base_url.rstrip("/") + "/rest/v1/templates"
        self.headers = {"apikey": api_key, "Authorization": "Bearer " + api_key}
        self.opener = opener

    def request(self, method, filters=None, payload=None):
        url = self.endpoint + ("?" + urlencode(filters) if filters else "")
        headers = {**self.headers, "Content-Type": "application/json", "Prefer": "return=minimal"}
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
        request = Request(url, data=body, headers=headers, method=method)
        try:
            with self.opener(request, timeout=30) as response:
                if not 200 <= response.status < 300:
                    raise SyncError(f"Supabase {method} failed with HTTP {response.status}")
                raw = response.read()
        except HTTPError as error:
            # Do not print headers, response bodies, or environment values.
            raise SyncError(f"Supabase {method} failed with HTTP {error.code}") from None
        except (URLError, TimeoutError, OSError):
            raise SyncError(f"Supabase {method} failed to connect") from None
        if method != "GET":
            return None
        try:
            rows = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise SyncError("Supabase GET returned invalid JSON") from None
        if not isinstance(rows, list):
            raise SyncError("Supabase GET did not return a row list")
        return rows


def sync_file(file, owner, repository, client):
    if not TEMPLATE_FILE.fullmatch(file.name):
        raise SyncError("Unsupported template filename")
    pages_url = f"https://{owner}.github.io/{quote(repository, safe='')}/{quote(file.name, safe='')}"
    metadata = embedded_metadata(file)
    rows = client.request("GET", {"url": "eq." + pages_url, "select": "id", "limit": "2"})
    if len(rows) > 1:
        raise SyncError(f"{file.name}: duplicate URL records require review")
    payload = {"url": pages_url}
    if metadata:
        payload.update(
            name=f"模板{file.stem}｜{metadata['name']}",
            tag=metadata["role"],
            description=f"{metadata['role']} · 参考{metadata['refIndex']}。照片、文字、字号和色彩可编辑。参考信息仅作排版示例，发布时替换本店已确认素材与文案。",
            img=metadata["referenceDataUrl"],
        )
    if rows:
        db_id = rows[0].get("id") if isinstance(rows[0], dict) else None
        if not isinstance(db_id, (str, int)) or isinstance(db_id, bool) or str(db_id) == "":
            raise SyncError(f"{file.name}: existing URL record has no database id")
        client.request("PATCH", {"id": "eq." + str(db_id), "url": "eq." + pages_url}, payload)
        return "updated"
    slug = file.stem.removeprefix("template-")
    payload.setdefault("name", "模板" + slug)
    payload.update(is_active=True, sort_order=int(slug) if slug.isdecimal() else 99)
    client.request("POST", payload=payload)
    return "created"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-metadata", action="store_true", help="Validate the 14 local definitions without credentials or HTTP")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    if args.check_metadata:
        metadata = [embedded_metadata(repo / f"{ident}.html") for ident in NEW_IDS]
        print(f"Validated {len(metadata)} embedded template definitions and reference covers.")
        return
    if os.environ.get("SYNC_EVENT_NAME") == "workflow_dispatch":
        files = requested_templates(repo, os.environ.get("SYNC_REQUESTED_FILES", ""))
    else:
        files = selected_templates(repo, git_changed(repo))
    if not files:
        print("No template files changed.")
        return
    # Validate the entire requested batch before the first HTTP mutation.
    for file in files:
        embedded_metadata(file)
    required = ["SB_URL", "SB_KEY", "GITHUB_USER", "GITHUB_REPO_NAME"]
    if any(not os.environ.get(key) for key in required):
        raise SyncError("Missing required workflow environment variable")
    client = SupabaseClient(os.environ["SB_URL"], os.environ["SB_KEY"])
    for file in files:
        action = sync_file(file, os.environ["GITHUB_USER"], os.environ["GITHUB_REPO_NAME"], client)
        print(f"{file.name}: {action}")


if __name__ == "__main__":
    try:
        main()
    except SyncError as error:
        print(f"Sync failed: {error}", file=sys.stderr)
        raise SystemExit(1)
