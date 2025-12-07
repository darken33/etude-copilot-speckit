#!/usr/bin/env python3
"""
Generate richer Javadoc stubs for undocumented public/protected elements.

Reads `reports/javadoc_coverage.txt` and inserts a Javadoc block with a short
description plus `@param` and `@return` tags when the declaration is a method.

It modifies source files in-place. Review changes before committing.
"""
import re
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'reports' / 'javadoc_coverage.txt'
MAX_INSERT = 30

# pattern used by reports: ' - path:lineno [kind] name'
re_line = re.compile(r"^-?\s*(.+?):(\d+)\s+\[(\w+)\]\s+(.+)$")


def parse_report():
    if not REPORT.exists():
        print(f'Report not found: {REPORT}')
        return []
    items = []
    with REPORT.open(encoding='utf-8') as fh:
        for line in fh:
            s = line.strip()
            if s.startswith('```'):
                continue
            m = re_line.search(s)
            if m:
                rel, ln, kind, name = m.groups()
                items.append((Path(rel.strip()), int(ln), kind.strip(), name.strip()))
    return items


def guess_params_from_signature(signature_line):
    # crude extraction: find '('..')' and split by ',' then take param names
    m = re.search(r"\((.*)\)", signature_line)
    if not m:
        return []
    inside = m.group(1).strip()
    if not inside:
        return []
    parts = [p.strip() for p in inside.split(',')]
    names = []
    for p in parts:
        # attempt to get last token as name
        tokens = p.split()
        if not tokens:
            continue
        name = tokens[-1]
        # remove annotations like @Nonnull and generics noise
        name = name.replace('...', '')
        # if name contains '<' it's probably a type, fallback to paramN
        if '<' in name or name in ('final', 'int', 'long', 'String'):
            name = None
        names.append(name or 'param')
    return names


def insert_rich_stub(path: Path, lineno: int, kind: str, name: str):
    full = ROOT / path
    if not full.exists():
        print(f'File not found: {full}')
        return False

    text = full.read_text(encoding='utf-8')
    lines = text.splitlines()
    idx = lineno - 1
    start = max(0, idx - 6)
    end = min(len(lines), idx + 6)

    # build patterns
    if kind == 'type':
        pattern = re.compile(r"^\s*(public|protected)\s+(?:class|interface|enum)\s+" + re.escape(name) + r"\b")
    else:
        # method or constructor
        pattern = re.compile(r"^\s*(public|protected)[\s\w\<\>\[\]]+\s+" + re.escape(name) + r"\s*\(")

    decl_idx = None
    for i in range(start, end):
        if pattern.search(lines[i]):
            decl_idx = i
            break
    if decl_idx is None:
        # fallback to whole file
        for i, l in enumerate(lines):
            if pattern.search(l):
                decl_idx = i
                break

    if decl_idx is None:
        print(f'Declaration not found for {name} in {full}')
        return False

    # check if javadoc exists already
    i = decl_idx - 1
    while i >= 0 and lines[i].strip() == '':
        i -= 1
    if i >= 0 and lines[i].strip().startswith('/**'):
        return False

    # build stub
    stub = []
    stub.append('/**')
    if kind == 'type':
        stub.append(f' * {name} - TODO: description')
        stub.append(' *')
        stub.append(' * @author TODO')
    else:
        # try to capture signature line to guess params/return
        sig = lines[decl_idx]
        # if signature spans multiple lines, concatenate a few lines
        j = decl_idx
        sig_acc = sig
        while '(' in sig_acc and ')' not in sig_acc and j+1 < len(lines) and j < decl_idx+6:
            j += 1
            sig_acc += ' ' + lines[j].strip()

        params = guess_params_from_signature(sig_acc)
        stub.append(f' * {name} - TODO: description')
        stub.append(' *')
        for p in params:
            stub.append(f' * @param {p} TODO')

        # try to detect void return
        if not re.search(r"\)\s*:\s*void", sig_acc) and not re.search(r"\)\s*void", sig_acc):
            # best-effort: if signature contains ' void ' after modifiers, skip return
            if re.search(r"\bvoid\b", sig_acc):
                pass
            else:
                stub.append(' * @return TODO')

    stub.append(' */')

    new_lines = lines[:decl_idx] + stub + lines[decl_idx:]
    full.write_text('\n'.join(new_lines), encoding='utf-8')
    print(f'Inserted rich stub for {name} in {path}:{decl_idx+1}')
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
        ok = insert_rich_stub(path, ln, kind, name)
        if ok:
            inserted += 1

    print(f'Done. Rich stubs inserted: {inserted}')


if __name__ == '__main__':
    main()
