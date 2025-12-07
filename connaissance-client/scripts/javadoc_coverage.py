#!/usr/bin/env python3
"""
Simple Javadoc coverage analyzer.

Scans Java source files under the workspace for public/protected classes, interfaces,
constructors and methods, and checks whether they are preceded by a Javadoc comment (/** ... */).

Outputs a report to stdout and writes detailed report to `reports/javadoc_coverage.txt`.
"""
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JAVA_EXT = '.java'

re_javadoc_end = re.compile(r"\*/\s*$")
re_javadoc_start = re.compile(r"^\s*/\*\*")

# Matches declarations of classes, interfaces, enums, methods, constructors
re_declaration = re.compile(r"^\s*(public|protected)\s+(?:class|interface|enum)\s+([A-Za-z0-9_]+)|^\s*(public|protected)\s+[\w\<\>\[\]]+\s+([A-Za-z0-9_]+)\s*\(|^\s*(public|protected)\s+([A-Za-z0-9_]+)\s*\(|^\s*(public|protected)\s+([A-Za-z0-9_]+)\s*$")


def find_java_files(root: Path):
    for dirpath, dirs, files in os.walk(root):
        # skip target directories
        if '/target/' in dirpath or dirpath.endswith('target'):
            continue
        for f in files:
            if f.endswith(JAVA_EXT):
                yield Path(dirpath) / f


def has_javadoc_before(lines, idx):
    # Walk backwards from idx-1 skipping blank lines and annotations
    i = idx - 1
    while i >= 0:
        line = lines[i].rstrip()
        if not line:
            i -= 1
            continue
        if line.strip().startswith('@'):
            i -= 1
            continue
        # Check if this line ends a javadoc and search for start
        if re_javadoc_end.search(line):
            # scan backwards for start
            j = i
            while j >= 0:
                if re_javadoc_start.search(lines[j]):
                    return True
                j -= 1
            return False
        # If it's a comment but not javadoc, treat as not javadoc
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            return False
        # Otherwise it's code or something else, no javadoc
        return False
    return False


def analyze_file(path: Path):
    with path.open(encoding='utf-8') as fh:
        lines = fh.readlines()

    results = []  # tuples (lineno, kind, name, has_javadoc)

    for idx, raw in enumerate(lines):
        line = raw.rstrip('\n')
        m = re_declaration.match(line)
        if m:
            # Determine name and kind
            name = None
            kind = 'member'
            if m.group(2):
                name = m.group(2)
                kind = 'type'
            else:
                # methods/constructors
                for g in (4,6,7):
                    if g <= len(m.groups()) and m.group(g):
                        name = m.group(g)
                        kind = 'method'
                        break

            if name:
                jd = has_javadoc_before(lines, idx)
                results.append((idx+1, kind, name, jd))

    return results


def main():
    java_files = list(find_java_files(ROOT))
    total = 0
    documented = 0
    undoc_examples = []
    report_lines = []

    for jf in java_files:
        res = analyze_file(jf)
        if not res:
            continue
        for lineno, kind, name, jd in res:
            total += 1
            if jd:
                documented += 1
            else:
                undoc_examples.append((jf.relative_to(ROOT), lineno, kind, name))

    pct = (documented / total * 100) if total else 100.0

    report_lines.append(f"Javadoc coverage report for project: {ROOT}\n")
    report_lines.append(f"Scanned Java files: {len(java_files)}\n")
    report_lines.append(f"Documented elements: {documented}\n")
    report_lines.append(f"Total public/protected elements: {total}\n")
    report_lines.append(f"Coverage: {pct:.2f}%\n")
    report_lines.append('\nTop undocumented elements (first 200):\n')
    for p, ln, kind, name in undoc_examples[:200]:
        report_lines.append(f" - {p}:{ln} [{kind}] {name}\n")

    out_dir = ROOT / 'reports'
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / 'javadoc_coverage.txt'
    with out_file.open('w', encoding='utf-8') as fh:
        fh.writelines(report_lines)

    print('Javadoc coverage summary:')
    print(''.join(report_lines[:6]))
    print(f'Detailed report written to: {out_file}')


if __name__ == '__main__':
    main()
