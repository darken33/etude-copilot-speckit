#!/usr/bin/env python3
"""
Generate simple Javadoc stubs for undocumented public/protected elements.

This script reads `reports/javadoc_coverage.txt`, extracts the top undocumented
elements, and inserts a minimal Javadoc block above the declaration if not present.

It modifies source files in-place. Use with care and review changes before commit.
"""
import re
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'reports' / 'javadoc_coverage.txt'
MAX_INSERT = 30

# line pattern in report: ' - path:lineno [kind] name'
re_line = re.compile(r"^-?\s*(.+?):(\d+)\s+\[(\w+)\]\s+(.+)$")


def parse_report():
    if not REPORT.exists():
        print(f'Report not found: {REPORT}')
        return []
    items = []
    with REPORT.open(encoding='utf-8') as fh:
        for line in fh:
            # remove code fence markers and surrounding whitespace
            s = line.strip()
            if s.startswith('```'):
                continue
            # try to find the pattern anywhere on the line
            m = re_line.search(s)
            if m:
                rel, ln, kind, name = m.groups()
                items.append((Path(rel.strip()), int(ln), kind.strip(), name.strip()))
    return items


def insert_stub(path: Path, lineno: int, kind: str, name: str):
    full = ROOT / path
    if not full.exists():
        print(f'File not found: {full}')
        return False

    lines = full.read_text(encoding='utf-8').splitlines()
    idx = lineno - 1
    # Walk up to find the declaration line if line numbers mismatch
    start = max(0, idx - 3)
    end = min(len(lines), idx + 3)
    decl_line = None
    decl_idx = None
    pattern = None
    if kind == 'type':
        pattern = re.compile(r"^\s*(public|protected)\s+(?:class|interface|enum)\s+" + re.escape(name) + r"\b")
    else:
        # method or constructor - look for name followed by '('
        pattern = re.compile(r"^\s*(public|protected)[\s\w\<\>\[\]]+\s+" + re.escape(name) + r"\s*\(")

    for i in range(start, end):
        if pattern.search(lines[i]):
            decl_line = lines[i]
            decl_idx = i
            break

    if decl_idx is None:
        # fallback: search whole file
        for i, l in enumerate(lines):
            if pattern.search(l):
                decl_line = l
                decl_idx = i
                break

    if decl_idx is None:
        print(f'Declaration not found for {name} in {full}')
        return False

    # Check previous non-empty, non-annotation lines for javadoc
    i = decl_idx - 1
    while i >= 0 and lines[i].strip() == '':
        i -= 1
    if i >= 0 and lines[i].strip().startswith('/**'):
        # already has javadoc
        return False

    # Insert stub above decl_idx
    stub = []
    stub.append('/**')
    if kind == 'type':
        stub.append(f' * {name} - TODO: description')
    else:
        stub.append(f' * {name}() - TODO: description')
    stub.append(' *')
    stub.append(' * @todo Add detailed Javadoc')
    stub.append(' */')

    new_lines = lines[:decl_idx] + stub + lines[decl_idx:]
    full.write_text('\n'.join(new_lines), encoding='utf-8')
    print(f'Inserted stub for {name} in {path}:{decl_idx+1}')
    return True


def main():
    items = parse_report()
    if not items:
        print('No items to process')
        return

    inserted = 0
    for path, ln, kind, name in items:
        if inserted >= MAX_INSERT:
            break
        ok = insert_stub(path, ln, kind, name)
        if ok:
            inserted += 1

    print(f'Done. Stubs inserted: {inserted}')


if __name__ == '__main__':
    main()
