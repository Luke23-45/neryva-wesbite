"""
One-time codemod: adopts the ViewLayout kit + pageItem motion preset in a
dashboard view pair (.tsx + .styles.ts).

Transforms:
- .tsx: PageRoot/PageHeader/PageTitle/PageSubtitle (+ TitleBlock) renamed to
  kit equivalents; kit import added; local premiumEase/fadeUp removed;
  variants={fadeUp} -> variants={pageItem}.
- .styles.ts: the (identical) styled definitions for those blocks removed.

Usage: python scratch/kitify.py <View.tsx> <View.styles.ts>
"""
import re
import sys

STYLE_DEFS = [
    "PageRoot",
    "PageHeader",
    "TitleBlock",
    "PageTitle",
    "PageSubtitle",
]

RENAME = {
    "PageRoot": "ViewShell",
    "PageHeader": "ViewHeader",
    "PageTitle": "ViewTitle",
    "PageSubtitle": "ViewSubtitle",
}


def strip_styles(styles: str) -> tuple[str, list[str]]:
    removed = []
    for name in STYLE_DEFS:
        pattern = re.compile(
            r"export const %s = styled(?:\.\w+)?(?:<[^>]*>)?`[^`]*`;\n\n?" % name
        )
        styles, n = pattern.subn("", styles)
        if n:
            removed.append(name)
    return styles, removed


def fix_tsx(tsx: str, removed: list[str]) -> str:
    used = [RENAME[n] for n in removed if n in RENAME]

    # Remove those names from the './X.styles' import list.
    def clean_import(match: re.Match) -> str:
        inner = match.group(2)
        names = [n.strip() for n in inner.split(",")]
        names = [n for n in names if n and n not in removed]
        if not names:
            return ""
        return match.group(1) + ",\n  " + ",\n  ".join(names) + ",\n} from './" + match.group(3) + "'"

    tsx = re.sub(
        r"import \{\n?([^}]*)\n?\} from '\./([^']+)'",
        lambda m: clean_import_wrapper(m, removed),
        tsx,
    )

    # Rename identifiers.
    for old, new in RENAME.items():
        if old in removed:
            tsx = re.sub(r"\b%s\b" % old, new, tsx)

    # Kit import (after the last @components import, or before the styles import).
    if used:
        kit_line = (
            "import { " + ", ".join(used) + " } from '@components/common/ui/ViewLayout';\n"
        )
        match = re.search(r"(import [^\n]*from '@components/[^\n]*\n)(?!import)", tsx)
        if match:
            tsx = tsx[: match.end()] + kit_line + tsx[match.end() :]
        else:
            tsx = kit_line + tsx

    # Remove local motion constants; swap variants.
    tsx = re.sub(
        r"const premiumEase = (?:\[0\.16, 1, 0\.3, 1\] as const|ease\.standard);\n", "", tsx
    )
    tsx = re.sub(r"const fadeUp = \{[\s\S]*?\n\};\n\n?", "", tsx)
    tsx = tsx.replace("variants={fadeUp}", "variants={pageItem}")
    if "variants={pageItem}" in tsx and "pageItem" not in tsx.split("from '@styles/motion'")[0]:
        if re.search(r"import \{([^}]*)\} from '@styles/motion';", tsx):
            tsx = re.sub(
                r"import \{([^}]*)\} from '@styles/motion';",
                lambda m: "import {%s pageItem } from '@styles/motion';"
                % ("" if "pageItem" in m.group(1) else m.group(1).rstrip() + ", "),
                tsx,
                count=1,
            )
        else:
            tsx = "import { pageItem } from '@styles/motion';\n" + tsx
    return tsx


def clean_import_wrapper(match: re.Match, removed: list[str]) -> str:
    inner = match.group(1)
    names = [n.strip() for n in inner.split(",") if n.strip()]
    kept = [n for n in names if n not in removed]
    if not kept:
        return ""
    return "import {\n  " + ",\n  ".join(kept) + ",\n} from './" + match.group(2) + "'"


def main():
    tsx_path, styles_path = sys.argv[1], sys.argv[2]
    with open(styles_path, encoding="utf-8") as f:
        styles = f.read()
    styles, removed = strip_styles(styles)
    with open(styles_path, "w", encoding="utf-8", newline="") as f:
        f.write(styles)

    with open(tsx_path, encoding="utf-8") as f:
        tsx = f.read()
    tsx = fix_tsx(tsx, removed)
    with open(tsx_path, "w", encoding="utf-8", newline="") as f:
        f.write(tsx)
    print(f"{tsx_path}: removed {removed} from styles, renamed + kitified")


if __name__ == "__main__":
    main()
