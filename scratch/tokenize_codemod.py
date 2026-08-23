"""
One-time codemod: replaces raw dark-surface colors/sizes in styled CSS
blocks with theme.app.* tokens.

Rules:
- Inline JS styles use quoted values ('#f5f7fb') — never touched.
- Ambiguous white-alpha values (used for BOTH backgrounds and borders) are
  replaced only in a property-scoped context (background:/border:), never bare.
- Unambiguous values (text greys, status colorways) are replaced anywhere
  inside template literals.

Usage: python scratch/tokenize_codemod.py <files...>
"""
import re
import sys


def scoped(prop_re: str, value: str, token: str, prefix_re: str = ""):
    pattern = re.compile(r"(%s:\s*%s)%s(\s*;)" % (prop_re, prefix_re, re.escape(value)))
    repl = r"\1${({ theme }) => theme.%s}\2" % token
    return pattern, repl


TEXT = [
    ("#f5f7fb", "app.text.primary"),
    ("#e6e9ef", "app.text.body"),
    ("rgba(229, 231, 235, 0.85)", "app.text.secondary"),
    ("rgba(229, 231, 235, 0.8)", "app.text.secondary"),
    ("rgba(229, 231, 235, 0.78)", "app.text.secondary"),
    ("rgba(229, 231, 235, 0.75)", "app.text.secondary"),
    ("rgba(229, 231, 235, 0.72)", "app.text.secondary"),
    ("rgba(229, 231, 235, 0.7)", "app.text.muted"),
    ("rgba(229, 231, 235, 0.65)", "app.text.muted"),
    ("rgba(229, 231, 235, 0.6)", "app.text.muted"),
    ("rgba(229, 231, 235, 0.55)", "app.text.muted"),
    ("rgba(229,231,235,0.55)", "app.text.muted"),
    ("rgba(229, 231, 235, 0.5)", "app.text.faint"),
    ("rgba(229, 231, 235, 0.45)", "app.text.faint"),
    ("rgba(229, 231, 235, 0.4)", "app.text.ghost"),
]

# White-alpha fills — context-scoped only (background / background-color).
BG = [
    ("rgba(255, 255, 255, 0.02)", "app.surface.subtle"),
    ("rgba(255,255,255,0.02)", "app.surface.subtle"),
    ("rgba(255, 255, 255, 0.03)", "app.surface.subtle"),
    ("rgba(255,255,255,0.03)", "app.surface.subtle"),
    ("rgba(255, 255, 255, 0.04)", "app.surface.tint"),
    ("rgba(255,255,255,0.04)", "app.surface.tint"),
    ("rgba(255, 255, 255, 0.05)", "app.surface.hover"),
    ("rgba(255,255,255,0.05)", "app.surface.hover"),
    ("rgba(255, 255, 255, 0.06)", "app.surface.active"),
    ("rgba(255,255,255,0.06)", "app.surface.active"),
    ("rgba(255, 255, 255, 0.08)", "app.surface.active"),
    ("rgba(255,255,255,0.08)", "app.surface.active"),
    ("rgba(255, 255, 255, 0.10)", "app.surface.active"),
    ("rgba(255, 255, 255, 0.1)", "app.surface.active"),
]

# White-alpha hairlines — context-scoped only (border*, optional width/style prefix).
BORDER = [
    ("rgba(255, 255, 255, 0.04)", "app.border.hairline"),
    ("rgba(255,255,255,0.04)", "app.border.hairline"),
    ("rgba(255, 255, 255, 0.05)", "app.border.default"),
    ("rgba(255, 255, 255, 0.06)", "app.border.default"),
    ("rgba(255,255,255,0.06)", "app.border.default"),
    ("rgba(255, 255, 255, 0.08)", "app.border.strong"),
    ("rgba(255,255,255,0.08)", "app.border.strong"),
    ("rgba(255, 255, 255, 0.10)", "app.border.strong"),
    ("rgba(255, 255, 255, 0.1)", "app.border.strong"),
    ("rgba(255, 255, 255, 0.12)", "app.border.hover"),
    ("rgba(255, 255, 255, 0.14)", "app.border.hover"),
    ("rgba(255, 255, 255, 0.16)", "app.border.hover"),
    ("rgba(255, 255, 255, 0.18)", "app.border.hover"),
]

STATUS = [
    # fg (also used bare, e.g. box-shadow tints)
    ("#34d399", "app.status.success.fg"),
    ("#6ee7b7", "app.status.emerald.fg"),
    ("#fbbf24", "app.status.warning.fg"),
    ("#f87171", "app.status.error.fg"),
    ("#fca5a5", "app.status.error.fg"),
    ("#93c5fd", "app.status.info.fg"),
    ("#d8b4fe", "app.status.lilac.fg"),
    # bg tints
    ("rgba(16, 185, 129, 0.10)", "app.status.success.bg"),
    ("rgba(16,185,129,0.10)", "app.status.success.bg"),
    ("rgba(5, 227, 164, 0.10)", "app.status.emerald.bg"),
    ("rgba(245, 158, 11, 0.10)", "app.status.warning.bg"),
    ("rgba(245,158,11,0.10)", "app.status.warning.bg"),
    ("rgba(239, 68, 68, 0.10)", "app.status.error.bg"),
    ("rgba(239,68,68,0.10)", "app.status.error.bg"),
    ("rgba(59, 130, 246, 0.10)", "app.status.info.bg"),
    ("rgba(37, 99, 235, 0.10)", "app.status.azure.bg"),
    ("rgba(192, 132, 252, 0.10)", "app.status.lilac.bg"),
    ("rgba(192,132,252,0.10)", "app.status.lilac.bg"),
    ("rgba(168, 85, 247, 0.10)", "app.status.amethyst.bg"),
    # border tints
    ("rgba(16, 185, 129, 0.30)", "app.status.success.border"),
    ("rgba(5, 227, 164, 0.30)", "app.status.emerald.border"),
    ("rgba(245, 158, 11, 0.30)", "app.status.warning.border"),
    ("rgba(239, 68, 68, 0.30)", "app.status.error.border"),
    ("rgba(59, 130, 246, 0.30)", "app.status.info.border"),
    ("rgba(37, 99, 235, 0.30)", "app.status.azure.border"),
    ("rgba(192, 132, 252, 0.30)", "app.status.lilac.border"),
    ("rgba(168, 85, 247, 0.30)", "app.status.amethyst.border"),
]

SIZES = [
    ("10.5px", "app.type.micro"),
    ("11.5px", "app.type.micro"),
    ("11px", "app.type.micro"),
    ("12.5px", "app.type.caption"),
    ("12px", "app.type.caption"),
    ("13.5px", "app.type.body"),
    ("13px", "app.type.body"),
    ("14.5px", "app.type.bodyLg"),
    ("14px", "app.type.bodyLg"),
    ("15px", "app.type.title"),
]

BORDER_PROPS = "border(?:-top|-bottom|-left|-right|-color)?"
BG_PROPS = "background(?:-color)?"


def apply(content: str) -> tuple[str, int]:
    count = 0

    # 1. Scoped: backgrounds and borders (ambiguous whites keep their context).
    for value, token in BG:
        p, r = scoped(BG_PROPS, value, token)
        content, n = p.subn(r, content)
        count += n
    for value, token in BORDER:
        p, r = scoped(BORDER_PROPS, value, token, prefix_re=r"(?:[\d.]+px\s+solid\s+|[\d.]+px\s+)?")
        content, n = p.subn(r, content)
        count += n

    # 2. Scoped: font sizes.
    for value, token in SIZES:
        p, r = scoped("font-size", value, token)
        content, n = p.subn(r, content)
        count += n

    # 3. Bare: unambiguous values only (text greys + status colorways).
    for value, token in TEXT + STATUS:
        pattern = re.compile(r"(?<!['\"a-zA-Z0-9])" + re.escape(value) + r"(?!['\"])")
        content, n = pattern.subn("${({ theme }) => theme.%s}" % token, content)
        count += n

    # 4. Brand gradient.
    content, n = re.subn(
        r"linear-gradient\(135deg, #c084fc 0%, #2563eb 100%\)",
        "${({ theme }) => theme.colors.gradients.primary}",
        content,
    )
    count += n
    return content, count


def main():
    total = 0
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            content = f.read()
        new, n = apply(content)
        if n:
            with open(path, "w", encoding="utf-8", newline="") as f:
                f.write(new)
        total += n
        print(f"{path}: {n} replacements")
    print(f"TOTAL: {total}")


if __name__ == "__main__":
    main()
