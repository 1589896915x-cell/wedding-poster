"""Sync changed template URLs using the workflow's existing Supabase secrets.

Only templates 63–76 receive embedded metadata updates. Older templates retain
their manually maintained metadata and cover image. Equivalent URLs identify
one template, so updating a file does not create another catalog card.
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
from urllib.parse import quote, unquote, urlencode, urlsplit
from urllib.request import Request, urlopen


NEW_IDS = range(63, 77)
TEMPLATE_FILE = re.compile(r"(?:[0-9]+|template-[^/\\]+)\.html\Z")
DEFINITION = re.compile(r"<script\b[^>]*>\s*window\.TEMPLATE\s*=\s*", re.I)
COVER = re.compile(r"data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)\Z")
CATALOG_HOSTS = {"xieyu-poster.top", "www.xieyu-poster.top", "wedding-poster-eight.vercel.app"}


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


def rendered_preview(file):
    """Require the actual exported JPEG in the same repository before syncing it."""
    relative = f"previews/{file.stem}.jpg"
    preview = Path(__file__).resolve().parents[2] / relative
    if not preview.is_file():
        raise SyncError(f"{file.name}: missing rendered preview {relative}")
    data = preview.read_bytes()
    if not data.startswith(b"\xff\xd8\xff") or not data.endswith(b"\xff\xd9"):
        raise SyncError(f"{file.name}: rendered preview must be a complete JPEG")
    # Check JPEG segment boundaries and the start-of-frame dimensions, without
    # adding image-library dependencies to the existing workflow.
    offset = 2
    frame_markers = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
    while offset < len(data):
        if data[offset] != 0xFF:
            break
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            break
        marker = data[offset]
        offset += 1
        if marker in {0xDA, 0xD9}:
            break
        if marker in {0x01, *range(0xD0, 0xD8)}:
            continue
        length = int.from_bytes(data[offset:offset + 2], "big")
        if length < 2 or offset + length > len(data):
            break
        if marker in frame_markers and length >= 8:
            height = int.from_bytes(data[offset + 3:offset + 5], "big")
            width = int.from_bytes(data[offset + 5:offset + 7], "big")
            if width > 0 and height > 0:
                return relative
            break
        offset += length
    raise SyncError(f"{file.name}: rendered preview has no valid JPEG frame")


def selected_templates(repo, changed):
    selected = {p for p in changed if TEMPLATE_FILE.fullmatch(p)}
    return sorted((repo / name for name in selected if (repo / name).is_file()), key=lambda p: p.name)


def requested_templates(repo, value):
    """Manual inputs may name only existing root-level template files."""
    names = value.split()
    if not names or len(names) > 100 or len(names) != len(set(names)):
        raise SyncError("Manual files must contain 1–100 unique template filenames")
    if any(not TEMPLATE_FILE.fullmatch(name) for name in names):
        raise SyncError("Manual files must be root-level template HTML filenames")
    files = [repo / name for name in names]
    if any(not file.is_file() for file in files):
        raise SyncError("A requested template file is missing from the checked-out commit")
    return files


def git_changed(repo):
    before, head = os.environ.get("SYNC_BEFORE_SHA"), os.environ.get("SYNC_HEAD_SHA")
    if before is not None or head is not None:
        if not all(isinstance(sha, str) and re.fullmatch(r"[0-9a-fA-F]{40}", sha) for sha in (before, head)):
            raise SyncError("Push commit range must contain two valid Git SHAs")
        command = (["git", "ls-tree", "-r", "--name-only", head] if before == "0" * 40
                   else ["git", "diff", "--name-only", before, head, "--"])
        result = subprocess.run(command, cwd=repo, capture_output=True, text=True)
        if result.returncode != 0:
            raise SyncError("Cannot determine all changed files in the pushed commit range")
        return result.stdout.splitlines()
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


def template_identity(value, owner, repository):
    """Accept only this catalog's root templates and this repository's Pages URL."""
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = urlsplit(value.strip())
        path = unquote(parsed.path, errors="strict")
        if parsed.netloc:
            if parsed.scheme not in {"", "http", "https"} or parsed.username or parsed.password:
                return None
            if parsed.port is not None and parsed.port != (80 if parsed.scheme == "http" else 443):
                return None
            if parsed.hostname == f"{owner.lower()}.github.io":
                prefix = f"/{repository}/"
                if not path.startswith(prefix):
                    return None
                name = path[len(prefix):]
            elif parsed.hostname in CATALOG_HOSTS:
                name = path.removeprefix("/")
            else:
                return None
        else:
            if parsed.scheme:
                return None
            name = path.removeprefix("./").removeprefix("/")
    except (ValueError, UnicodeError):
        return None
    return name if TEMPLATE_FILE.fullmatch(name) else None


def catalog_rows(client):
    """Read every page before deciding a template is absent or writing anything."""
    rows, seen = [], set()
    while True:
        page = client.request("GET", {
            "select": "id,url,img,is_active", "order": "id.asc", "limit": "500", "offset": str(len(rows)),
        })
        if not isinstance(page, list):
            raise SyncError("Template catalog did not return a row list")
        if not page:
            return rows
        for row in page:
            if not isinstance(row, dict):
                raise SyncError("Template catalog contains an invalid row")
            ident = row.get("id")
            if (not isinstance(ident, (str, int)) or isinstance(ident, bool) or not str(ident).strip()
                    or not isinstance(row.get("url"), str) or not row["url"].strip()
                    or not isinstance(row.get("is_active"), bool)
                    or "img" not in row or row["img"] is not None and not isinstance(row["img"], str)):
                raise SyncError("Template catalog contains invalid id, URL, image or active state")
            if str(ident) in seen:
                raise SyncError("Template catalog pagination returned a repeated id")
            seen.add(str(ident))
            rows.append(row)
        # Continue even after a short page: the server may cap the requested limit.


def preferred_record(row):
    ident = str(row["id"])
    stable_id = (0, int(ident)) if ident.isdecimal() else (1, ident)
    return (not row["is_active"], not bool((row["img"] or "").strip()), stable_id)


def sync_file(file, owner, repository, client):
    if not TEMPLATE_FILE.fullmatch(file.name):
        raise SyncError("Unsupported template filename")
    pages_base = f"https://{owner}.github.io/{quote(repository, safe='')}/"
    pages_url = pages_base + quote(file.name, safe='')
    metadata = embedded_metadata(file)
    image_url = pages_base + rendered_preview(file) if metadata else None
    rows = [row for row in catalog_rows(client)
            if template_identity(row["url"], owner, repository) == file.name]
    existing = min(rows, key=preferred_record) if rows else None
    payload = {"url": existing["url"] if existing else pages_url}
    if metadata:
        payload.update(
            name=f"模板{file.stem}｜{metadata['name']}",
            tag=metadata["role"],
            description=f"{metadata['role']} · 参考{metadata['refIndex']}。照片、文字、字号和色彩可编辑。参考信息仅作排版示例，发布时替换本店已确认素材与文案。",
            img=image_url,
        )
    if existing:
        client.request("PATCH", {"id": "eq." + str(existing["id"])}, payload)
        for row in rows:
            if row["id"] != existing["id"] and row["is_active"]:
                client.request("PATCH", {"id": "eq." + str(row["id"])}, {"is_active": False})
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
        for ident in NEW_IDS:
            rendered_preview(repo / f"{ident}.html")
        print(f"Validated {len(metadata)} embedded template definitions and rendered JPEG previews.")
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
        if embedded_metadata(file):
            rendered_preview(file)
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
