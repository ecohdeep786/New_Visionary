"""Read-only OOXML extraction for the founder-spec reconciliation.

Run with the bundled document Python runtime. Sources are never modified;
external links, macros and embedded objects are never executed or fetched.
"""
import hashlib
import json
import pathlib
import re
import zipfile
from xml.etree import ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Visionary Secrert Document"
OUT = ROOT / "artifacts/research/founder-spec-review-2026-10-16"
OUT.mkdir(parents=True, exist_ok=True)
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"

def text(node):
    chunks = []
    for item in node.iter():
        if item.tag in (W + "t", W + "delText", M + "t"):
            chunks.append(item.text or "")
        elif item.tag == W + "tab":
            chunks.append("\t")
        elif item.tag in (W + "br", W + "cr"):
            chunks.append("\n")
    return "".join(chunks)

def blocks(parent):
    for node in parent:
        if node.tag == W + "p":
            value = text(node)
            if value.strip():
                style = node.find(W + "pPr/" + W + "pStyle")
                yield {"kind": "paragraph", "style": style.get(W + "val") if style is not None else "", "text": value}
        elif node.tag == W + "tbl":
            rows = [[text(cell) for cell in row.findall(W + "tc")] for row in node.findall(W + "tr")]
            yield {"kind": "table", "rows": rows, "text": "\n".join(" | ".join(row) for row in rows)}
        else:
            yield from blocks(node)

index = []
for sequence, source in enumerate(sorted(SOURCE.glob("*.docx")), 1):
    slug = f"{sequence:02d}-doc-{re.search(r'DOCUMENT (\d+)', source.name).group(1)}"
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    records, parts, media = [], [], []
    with zipfile.ZipFile(source) as archive:
        names = archive.namelist()
        relevant = ["word/document.xml"] + sorted(n for n in names if re.fullmatch(r"word/(?:header\d+|footer\d+|footnotes|endnotes|comments)\.xml", n))
        for part in relevant:
            xml = ET.fromstring(archive.read(part))
            parent = xml.find(W + "body") if part == "word/document.xml" else xml
            extracted = list(blocks(parent))
            records.extend({"part": part, **record} for record in extracted)
            parts.append({"part": part, "blocks": len(extracted), "insertions": len(list(xml.iter(W + "ins"))), "deletions": len(list(xml.iter(W + "del")))})
        for name in names:
            if name.startswith("word/media/") and not name.endswith("/"):
                target = OUT / "media" / slug / pathlib.PurePosixPath(name).name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.read(name))
                media.append(str(target.relative_to(ROOT)).replace("\\", "/"))
    target = OUT / (slug + ".txt")
    target.write_text("SOURCE " + source.name + "\nSHA256 " + digest + "\n\n" + "\n\n".join(f"[{i:04d} {r['kind']} {r['part']}] {r['text']}" for i, r in enumerate(records, 1)), encoding="utf-8")
    (OUT / (slug + ".json")).write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    combined = "\n".join(r["text"] for r in records)
    entry = {"id": slug, "source": str(source.relative_to(ROOT)).replace("\\", "/"), "sha256": digest, "textSha256": hashlib.sha256(combined.encode()).hexdigest(), "text": str(target.relative_to(ROOT)).replace("\\", "/"), "blocks": len(records), "characters": len(combined), "words": len(combined.split()), "parts": parts, "media": media}
    index.append(entry)
    print(json.dumps({"id": slug, "file": source.name, "words": entry["words"], "blocks": len(records), "media": len(media)}, ensure_ascii=False))
(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"files": len(index), "totalWords": sum(x["words"] for x in index), "media": sum(len(x["media"]) for x in index)}))
