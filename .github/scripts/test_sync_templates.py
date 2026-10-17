"""Regression checks for catalog identity and repeatable template synchronization."""

from copy import deepcopy
import os
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import sync_templates as sync


OWNER = "1589896915x-cell"
REPOSITORY = "wedding-poster"
PAGES = f"https://{OWNER}.github.io/{REPOSITORY}/"


def record(ident, url="43.html", img="manual-preview", active=True, **extra):
    return dict(id=ident, url=url, img=img, is_active=active, **extra)


class MemoryClient:
    """Model server pagination and persisted PATCH/POST effects across repeated runs."""

    def __init__(self, rows=(), cap=500, fail_offset=None):
        self.rows = deepcopy(list(rows))
        self.cap = cap
        self.fail_offset = fail_offset
        self.calls = []

    def request(self, method, filters=None, payload=None):
        self.calls.append((method, deepcopy(filters), deepcopy(payload)))
        if method == "GET":
            if set(filters) != {"select", "order", "limit", "offset"}:
                raise AssertionError("Catalog reads must be ordered and paginated")
            offset = int(filters["offset"])
            if offset == self.fail_offset:
                raise sync.SyncError("Simulated read failure")
            count = min(int(filters["limit"]), self.cap)
            return deepcopy(self.rows[offset:offset + count])
        if method == "PATCH":
            if set(filters) != {"id"}:
                raise AssertionError("Updates must address the retained database id")
            matches = [row for row in self.rows if filters["id"] == "eq." + str(row["id"])]
            if len(matches) != 1:
                raise AssertionError("Expected one PATCH target")
            matches[0].update(deepcopy(payload))
            return None
        if method == "POST":
            ident = max((row["id"] for row in self.rows), default=0) + 1
            self.rows.append({"id": ident, "img": None, **deepcopy(payload)})
            return None
        raise AssertionError(method)

    @property
    def writes(self):
        return [call for call in self.calls if call[0] != "GET"]


class TemplateIdentityTests(unittest.TestCase):
    def test_equivalent_urls(self):
        urls = [
            "43.html", "./43.html", "/43.html", "43.html?edit=1#preview",
            "https://xieyu-poster.top/43.html", "https://www.xieyu-poster.top/43.html",
            "https://wedding-poster-eight.vercel.app/43.html", PAGES + "43.html",
            PAGES + "%34%33.html?version=2", "//www.xieyu-poster.top/43.html",
        ]
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(sync.template_identity(url, OWNER, REPOSITORY), "43.html")

    def test_foreign_hosts_and_paths_are_excluded(self):
        urls = [
            "https://other.example/43.html", "https://xieyu-poster.top.evil.test/43.html",
            "https://xieyu-poster.top/folder/43.html", "https://www.xieyu-poster.top:444/43.html",
            f"https://{OWNER}.github.io/other/43.html", "https://another.github.io/wedding-poster/43.html",
            "https://user@xieyu-poster.top/43.html", "../43.html", "folder/43.html",
            "https://xieyu-poster.top/%2e%2e/43.html", "https://xieyu-poster.top/43.html/extra",
            "javascript:43.html", "https://[broken/43.html", "", None,
        ]
        for url in urls:
            with self.subTest(url=url):
                self.assertIsNone(sync.template_identity(url, OWNER, REPOSITORY))


class SyncTests(unittest.TestCase):
    def run_sync(self, client, filename="43.html"):
        return sync.sync_file(Path(filename), OWNER, REPOSITORY, client)

    def test_relative_and_disabled_absolute_update_twice_without_new_card(self):
        client = MemoryClient([
            record(60, name="我的模板43", tag="拼图", sort_order=43, description="手工说明"),
            record(96, PAGES + "43.html", img=None, active=False),
        ])
        original = deepcopy(client.rows)
        self.assertEqual(self.run_sync(client), "updated")
        self.assertEqual(self.run_sync(client), "updated")
        self.assertEqual(client.rows, original)
        self.assertEqual([call[0] for call in client.writes], ["PATCH", "PATCH"])
        self.assertTrue(all(call[1] == {"id": "eq.60"} for call in client.writes))

    def test_create_twice_creates_one_card(self):
        client = MemoryClient()
        self.assertEqual(self.run_sync(client), "created")
        self.assertEqual(self.run_sync(client), "updated")
        self.assertEqual(len(client.rows), 1)
        self.assertEqual(client.rows[0]["url"], PAGES + "43.html")
        self.assertEqual(client.rows[0]["name"], "模板43")
        self.assertTrue(client.rows[0]["is_active"])
        self.assertEqual([call[0] for call in client.writes], ["POST", "PATCH"])

    def test_production_catalog_shape_batch_repeated_twice(self):
        # 2026-10-16 read-only snapshot: actual ids/paths/active/image presence,
        # without embedding cover data, credentials or dependence on a live service.
        entries = ("13:1 14:2 15:3 16:4 17:5 18:6 19:7 20:10 21:8 22:9 "
                   "23:11 24:12 25:13 26:14 27:15 28:16 29:17 30:18 31:19 "
                   "32:20 33:21 34:22 35:23 36:24 37:25 38:26 39:27 40:28 41:29 "
                   "47:30 48:31 49:32 50:33 51:34 52:35 53:36 54:37 55:38 56:39 "
                   "57:40 58:41 59:42 60:43 61:44 62:45 63:46 64:47 65:48 "
                   "66:50 67:51 68:52 69:53 70:54 71:55 72:56 73:57 74:58 75:59 "
                   "77:62 78:63 79:64 80:65 81:66 82:67 83:68 84:69 85:70 "
                   "86:71 87:72 88:73 89:74 90:75 91:76")
        rows = []
        for item in entries.split():
            ident, number = map(int, item.split(":"))
            rows.append(record(ident, (PAGES if number >= 62 else "") + f"{number}.html",
                               img=None if number in (27, 33) else "existing-preview"))
        for ident, number in ((92, 1), (93, 10), (94, 34), (95, 4), (96, 43)):
            rows.append(record(ident, PAGES + f"{number}.html", img=None, active=False))
        client = MemoryClient(rows)
        for _ in range(2):
            for number in (1, 4, 10, 34, 43):
                self.assertEqual(self.run_sync(client, f"{number}.html"), "updated")
        self.assertEqual(len(client.rows), 78)
        self.assertEqual(client.rows, rows)
        self.assertEqual(sum(row["is_active"] for row in client.rows), 73)
        self.assertEqual(sum(call[0] == "POST" for call in client.calls), 0)

    def test_duplicates_keep_active_preview_and_manual_fields(self):
        client = MemoryClient([
            record(1, PAGES + "43.html", img=None, name="空白入口"),
            record(2, "/43.html", active=False, name="停用预览"),
            record(3, "43.html", name="手工名称", tag="封面", description="保留说明", sort_order=7),
            record(4, "https://www.xieyu-poster.top/43.html", name="另一有图入口"),
        ])
        retained = deepcopy(client.rows[2])
        self.run_sync(client)
        after_first = deepcopy(client.rows)
        self.run_sync(client)
        self.assertEqual(client.rows, after_first)
        self.assertEqual(client.rows[2], retained)
        self.assertEqual([row["id"] for row in client.rows if row["is_active"]], [3])
        self.assertEqual(len(client.rows), 4)  # duplicates are retained for recovery
        self.assertEqual(client.rows[0]["name"], "空白入口")

    def test_inactive_single_record_stays_inactive(self):
        client = MemoryClient([record(1, active=False)])
        self.run_sync(client)
        self.run_sync(client)
        self.assertFalse(client.rows[0]["is_active"])
        self.assertEqual(len(client.rows), 1)

    def test_active_record_preferred_to_inactive_preview(self):
        client = MemoryClient([record(1, active=False), record(2, PAGES + "43.html", img=None)])
        self.run_sync(client)
        self.assertEqual(client.writes[0][1], {"id": "eq.2"})
        self.assertFalse(client.rows[0]["is_active"])

    def test_foreign_record_is_neither_updated_nor_disabled(self):
        client = MemoryClient([record(1, "https://other.example/43.html")])
        foreign = deepcopy(client.rows[0])
        self.run_sync(client)
        self.assertEqual(client.rows[0], foreign)
        self.assertEqual(len(client.rows), 2)

    def test_large_catalog_and_server_page_cap_find_final_row(self):
        client = MemoryClient([record(i, f"https://other.example/{i}.html", img=None)
                               for i in range(1, 1204)] + [record(1300)], cap=137)
        self.run_sync(client)
        offsets = [int(call[1]["offset"]) for call in client.calls if call[0] == "GET"]
        self.assertEqual(offsets[-1], 1204)
        self.assertEqual(len(client.rows), 1204)
        self.assertEqual(client.writes, [("PATCH", {"id": "eq.1300"}, {"url": "43.html"})])

    def test_failed_later_page_does_not_create_or_modify(self):
        client = MemoryClient([record(1, "https://other.example/1.html")], cap=1, fail_offset=1)
        with self.assertRaises(sync.SyncError):
            self.run_sync(client)
        self.assertEqual(client.writes, [])

    def test_invalid_or_repeated_rows_fail_before_writes(self):
        invalid = [None, {}, record(True), record(""), record(1, active=None),
                   record(1, img={}), record(1, url="")]
        for row in invalid:
            with self.subTest(row=row):
                client = MemoryClient([row])
                with self.assertRaises(sync.SyncError):
                    self.run_sync(client)
                self.assertEqual(client.writes, [])
        client = MemoryClient([record(1), record(1)], cap=1)
        with self.assertRaises(sync.SyncError):
            self.run_sync(client)
        self.assertEqual(client.writes, [])

    def test_templates_63_to_76_keep_embedded_metadata_update_behavior(self):
        for ident in (63, 76):
            with self.subTest(ident=ident):
                client = MemoryClient([record(1, f"{ident}.html", active=False,
                                               name="旧名称", tag="旧分类", description="旧说明", sort_order=9)])
                metadata = dict(name="新排版", role="拼图", refIndex=ident - 62)
                with patch.object(sync, "embedded_metadata", return_value=metadata), \
                     patch.object(sync, "rendered_preview", return_value=f"previews/{ident}.jpg"):
                    self.run_sync(client, f"{ident}.html")
                row = client.rows[0]
                self.assertEqual(row["url"], f"{ident}.html")
                self.assertEqual(row["name"], f"模板{ident}｜新排版")
                self.assertEqual(row["tag"], "拼图")
                self.assertIn(f"参考{ident - 62}", row["description"])
                self.assertEqual(row["img"], PAGES + f"previews/{ident}.jpg")
                self.assertEqual(row["sort_order"], 9)
                self.assertFalse(row["is_active"])


class SelectionTests(unittest.TestCase):
    def test_manual_existing_root_templates_include_43(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            for name in ("43.html", "76.html", "template-custom.html"):
                (repo / name).touch()
            files = sync.requested_templates(repo, "43.html template-custom.html 76.html")
            self.assertEqual([file.name for file in files], ["43.html", "template-custom.html", "76.html"])
            for value in ("", "43.html 43.html", "../43.html", "index.html", "99.html",
                          " ".join(f"{i}.html" for i in range(101))):
                with self.subTest(value=value):
                    with self.assertRaises(sync.SyncError):
                        sync.requested_templates(repo, value)

    def test_push_range_covers_all_commits(self):
        before, head = "a" * 40, "b" * 40
        with patch.dict(os.environ, {"SYNC_BEFORE_SHA": before, "SYNC_HEAD_SHA": head}, clear=True), \
             patch.object(sync.subprocess, "run", return_value=subprocess.CompletedProcess([], 0, "1.html\n43.html\n")) as run:
            self.assertEqual(sync.git_changed(Path(".")), ["1.html", "43.html"])
        self.assertEqual(run.call_args.args[0], ["git", "diff", "--name-only", before, head, "--"])

    def test_new_branch_reads_all_files(self):
        with patch.dict(os.environ, {"SYNC_BEFORE_SHA": "0" * 40, "SYNC_HEAD_SHA": "b" * 40}, clear=True), \
             patch.object(sync.subprocess, "run", return_value=subprocess.CompletedProcess([], 0, "43.html\n")) as run:
            self.assertEqual(sync.git_changed(Path(".")), ["43.html"])
        self.assertEqual(run.call_args.args[0], ["git", "ls-tree", "-r", "--name-only", "b" * 40])

    def test_failed_push_range_does_not_fall_back_to_last_commit(self):
        with patch.dict(os.environ, {"SYNC_BEFORE_SHA": "a" * 40, "SYNC_HEAD_SHA": "b" * 40}, clear=True), \
             patch.object(sync.subprocess, "run", return_value=subprocess.CompletedProcess([], 1, "")) as run:
            with self.assertRaises(sync.SyncError):
                sync.git_changed(Path("."))
        self.assertEqual(run.call_count, 1)

    def test_invalid_push_sha_rejected(self):
        with patch.dict(os.environ, {"SYNC_BEFORE_SHA": "HEAD~1", "SYNC_HEAD_SHA": "b" * 40}, clear=True), \
             patch.object(sync.subprocess, "run") as run:
            with self.assertRaises(sync.SyncError):
                sync.git_changed(Path("."))
        run.assert_not_called()



class NewReferenceMetadataTests(unittest.TestCase):
    def write_definition(self, root, ref=4, role="封面"):
        path=Path(root)/"80.html"
        path.write_text("<script>window.TEMPLATE="+json.dumps({"id":80,"refIndex":ref,"name":"模板80 · 错位标题","role":role,"referenceDataUrl":"data:image/jpeg;base64,/9j/"})+";</script>")
        return path
    def test_accept_selected_reference_mapping(self):
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(sync.embedded_metadata(self.write_definition(root))["refIndex"],4)
    def test_reject_wrong_reference_for_new_id(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(sync.SyncError): sync.embedded_metadata(self.write_definition(root,18))
    def test_examples_77_79_remain_manual(self):
        for i in (77,78,79): self.assertIsNone(sync.embedded_metadata(Path(str(i)+".html")))

if __name__ == "__main__":
    unittest.main()
