#!/usr/bin/env python3
"""
Repo Readiness Scorer
Deterministically scores a repository for AI-assisted development readiness.
Usage: python score_repo.py [repo_path]
"""

import json
import os
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Signal definitions
# Each signal has: id, category, label, description, points, file_patterns
# file_patterns is a list of glob-style paths relative to repo root.
# A signal is "found" when ANY of its patterns matches an existing file.
# Bonus signals check content length (>100 chars) of already-found files.
# ---------------------------------------------------------------------------

SIGNALS = [
    # ── Category 1: Agent Context Files ─────────────────────────────────────
    {
        "id": "agents_md",
        "category": "agent_context",
        "label": "AGENTS.md",
        "description": "Top-level AGENTS.md file that describes the project to AI agents.",
        "points": 15,
        "patterns": ["AGENTS.md", ".github/AGENTS.md", "docs/AGENTS.md"],
    },
    {
        "id": "claude_md",
        "category": "agent_context",
        "label": "CLAUDE.md",
        "description": "CLAUDE.md file with project context for Claude.",
        "points": 15,
        "patterns": ["CLAUDE.md", ".github/CLAUDE.md", "docs/CLAUDE.md"],
    },
    {
        "id": "agent_context_quality",
        "category": "agent_context",
        "label": "Agent context has meaningful content",
        "description": "At least one agent context file has >200 characters of content.",
        "points": 10,
        "patterns": [],          # evaluated specially (content check)
        "content_check": True,
        "depends_on": ["agents_md", "claude_md"],
        "min_chars": 200,
    },
    # ── Category 2: Rules / Instructions ────────────────────────────────────
    {
        "id": "copilot_instructions",
        "category": "rules",
        "label": "GitHub Copilot instructions file",
        "description": "copilot-instructions.md that customises Copilot behaviour.",
        "points": 15,
        "patterns": [
            ".github/copilot-instructions.md",
            "copilot-instructions.md",
        ],
    },
    {
        "id": "cursor_rules",
        "category": "rules",
        "label": "Cursor rules file",
        "description": ".cursorrules or .cursor/rules that customise Cursor behaviour.",
        "points": 10,
        "patterns": [".cursorrules", ".cursor/rules"],
    },
    {
        "id": "other_instructions",
        "category": "rules",
        "label": "Other instruction files",
        "description": ".instructions.md files or a .github/instructions/ directory.",
        "points": 5,
        "patterns": [
            "*.instructions.md",
            ".github/instructions/*.md",
            ".vscode/*.instructions.md",
        ],
    },
    {
        "id": "rules_quality",
        "category": "rules",
        "label": "Rules have meaningful content",
        "description": "At least one rules file has >200 characters of content.",
        "points": 5,
        "patterns": [],
        "content_check": True,
        "depends_on": ["copilot_instructions", "cursor_rules", "other_instructions"],
        "min_chars": 200,
    },
    # ── Category 3: Repeatable AI Workflows ─────────────────────────────────
    {
        "id": "skill_files",
        "category": "workflows",
        "label": "SKILL.md workflow files",
        "description": "One or more SKILL.md files that package reusable AI workflows.",
        "points": 20,
        "patterns": [
            "SKILL.md",
            "**/.agents/skills/*/SKILL.md",
            ".agents/skills/*/SKILL.md",
            "skills/*/SKILL.md",
        ],
    },
    {
        "id": "prompt_files",
        "category": "workflows",
        "label": "Prompt (.prompt.md) files",
        "description": "Reusable prompt files in .github/prompts/, .vscode/prompts/, or similar.",
        "points": 10,
        "patterns": [
            ".github/prompts/*.prompt.md",
            ".vscode/prompts/*.prompt.md",
            "prompts/*.prompt.md",
            "**/*.prompt.md",
        ],
    },
    {
        "id": "multiple_workflows",
        "category": "workflows",
        "label": "Multiple workflow artifacts (3 or more)",
        "description": "Three or more prompt/skill files indicate a mature workflow library.",
        "points": 10,
        "patterns": [],
        "count_check": True,
        "count_patterns": [
            ".github/prompts/*.prompt.md",
            ".vscode/prompts/*.prompt.md",
            "prompts/*.prompt.md",
            "**/*.prompt.md",
            "**/.agents/skills/*/SKILL.md",
            ".agents/skills/*/SKILL.md",
            "skills/*/SKILL.md",
        ],
        "min_count": 3,
    },
]

CATEGORY_META = {
    "agent_context": {
        "label": "Agent Context Files",
        "max_points": sum(s["points"] for s in SIGNALS if s["category"] == "agent_context"),
        "description": "Files that tell AI agents about the project (AGENTS.md, CLAUDE.md).",
    },
    "rules": {
        "label": "Rules & Instructions",
        "max_points": sum(s["points"] for s in SIGNALS if s["category"] == "rules"),
        "description": "Configuration files that customise AI assistant behaviour.",
    },
    "workflows": {
        "label": "Repeatable AI Workflows",
        "max_points": sum(s["points"] for s in SIGNALS if s["category"] == "workflows"),
        "description": "Reusable skills and prompts that encode repeatable AI workflows.",
    },
}

MAX_SCORE = sum(s["points"] for s in SIGNALS)


def find_files(repo: Path, patterns: list[str]) -> list[Path]:
    """Return all existing files matching any of the given glob patterns."""
    found = []
    for pattern in patterns:
        # Support ** globs
        try:
            matches = list(repo.glob(pattern))
        except Exception:
            matches = []
        for m in matches:
            if m.is_file() and m not in found:
                found.append(m)
    return found


def check_content(repo: Path, signal: dict, found_signals: dict) -> tuple[bool, str]:
    """Return (passed, evidence) for a content-quality signal."""
    deps = signal.get("depends_on", [])
    for dep_id in deps:
        dep = found_signals.get(dep_id)
        if dep and dep["found"]:
            for f in dep["files"]:
                try:
                    text = Path(f).read_text(encoding="utf-8", errors="ignore")
                    if len(text.strip()) >= signal["min_chars"]:
                        return True, f"{f} has {len(text.strip())} characters"
                except Exception:
                    pass
    return False, "No qualifying files with sufficient content found"


def check_count(repo: Path, signal: dict) -> tuple[bool, str]:
    """Return (passed, evidence) for a count-threshold signal."""
    files = find_files(repo, signal["count_patterns"])
    # deduplicate by resolved path
    unique = list({f.resolve() for f in files})
    count = len(unique)
    passed = count >= signal["min_count"]
    evidence = f"Found {count} workflow artifact(s)" + (
        f": {', '.join(str(f.relative_to(repo)) for f in unique[:5])}"
        if unique
        else ""
    )
    return passed, evidence


def score_repo(repo_path: str) -> dict:
    repo = Path(repo_path).resolve()
    if not repo.is_dir():
        return {"error": f"Path is not a directory: {repo_path}"}

    results = {}

    # First pass: non-derived signals
    for signal in SIGNALS:
        if signal.get("content_check") or signal.get("count_check"):
            continue
        files = find_files(repo, signal["patterns"])
        rel_files = [str(f.relative_to(repo)) for f in files]
        results[signal["id"]] = {
            "found": bool(files),
            "files": rel_files,
            "points_earned": signal["points"] if files else 0,
            "points_max": signal["points"],
            "label": signal["label"],
            "description": signal["description"],
            "category": signal["category"],
        }

    # Second pass: derived signals (content + count checks)
    for signal in SIGNALS:
        if signal.get("content_check"):
            passed, evidence = check_content(repo, signal, results)
            results[signal["id"]] = {
                "found": passed,
                "files": [],
                "evidence": evidence,
                "points_earned": signal["points"] if passed else 0,
                "points_max": signal["points"],
                "label": signal["label"],
                "description": signal["description"],
                "category": signal["category"],
            }
        elif signal.get("count_check"):
            passed, evidence = check_count(repo, signal)
            results[signal["id"]] = {
                "found": passed,
                "files": [],
                "evidence": evidence,
                "points_earned": signal["points"] if passed else 0,
                "points_max": signal["points"],
                "label": signal["label"],
                "description": signal["description"],
                "category": signal["category"],
            }

    total_score = sum(r["points_earned"] for r in results.values())
    total_max = MAX_SCORE

    # Per-category rollup
    categories = {}
    for cat_id, cat_meta in CATEGORY_META.items():
        cat_signals = [r for r in results.values() if r["category"] == cat_id]
        earned = sum(s["points_earned"] for s in cat_signals)
        categories[cat_id] = {
            "label": cat_meta["label"],
            "description": cat_meta["description"],
            "score": earned,
            "max_score": cat_meta["max_points"],
            "pct": round(earned / cat_meta["max_points"] * 100) if cat_meta["max_points"] else 0,
        }

    # Readiness tier
    pct = total_score / total_max * 100 if total_max else 0
    if pct >= 80:
        tier = "AI-Ready"
        tier_description = (
            "This repository is well-equipped for AI-assisted development. "
            "Agents have the context, rules, and workflow artifacts they need to work effectively."
        )
    elif pct >= 55:
        tier = "Developing"
        tier_description = (
            "Good foundations are in place, but a few key artifacts are missing. "
            "Filling those gaps will significantly improve AI agent effectiveness."
        )
    elif pct >= 30:
        tier = "Getting Started"
        tier_description = (
            "Some signals are present but important context is missing. "
            "AI agents will struggle to understand the codebase without more guidance."
        )
    else:
        tier = "Not Ready"
        tier_description = (
            "This repository lacks the artifacts that enable effective AI-assisted development. "
            "Adding even a single well-written AGENTS.md will make a big difference."
        )

    # Build prioritised improvement list (only missing signals)
    missing = [
        {
            "id": sid,
            "label": r["label"],
            "description": r["description"],
            "category": r["category"],
            "points_available": r["points_max"],
        }
        for sid, r in results.items()
        if not r["found"]
        and not r.get("evidence", "").startswith("Found")  # exclude count signals that just didn't pass
    ]
    # Sort by points descending
    missing.sort(key=lambda x: x["points_available"], reverse=True)

    return {
        "repo_path": str(repo),
        "total_score": total_score,
        "total_max": total_max,
        "pct": round(pct, 1),
        "tier": tier,
        "tier_description": tier_description,
        "categories": categories,
        "signals": results,
        "missing": missing,
    }


def print_report(data: dict) -> None:
    if "error" in data:
        print(f"Error: {data['error']}", file=sys.stderr)
        return

    bar_width = 30

    def bar(score, max_score):
        filled = round(score / max_score * bar_width) if max_score else 0
        return "█" * filled + "░" * (bar_width - filled)

    print()
    print("╔══════════════════════════════════════════════╗")
    print(f"  Repo Readiness Score: {data['total_score']}/{data['total_max']} ({data['pct']}%)")
    print(f"  Tier: {data['tier']}")
    print("╚══════════════════════════════════════════════╝")
    print()
    print(data["tier_description"])
    print()

    print("── Category Breakdown ──────────────────────────")
    for cat in data["categories"].values():
        b = bar(cat["score"], cat["max_score"])
        print(f"  {cat['label']:<30}  {cat['score']:>2}/{cat['max_score']:>2}  [{b}]")
    print()

    print("── Signal Details ──────────────────────────────")
    current_cat = None
    for signal in SIGNALS:
        r = data["signals"].get(signal["id"])
        if r is None:
            continue
        if r["category"] != current_cat:
            current_cat = r["category"]
            cat_label = CATEGORY_META[current_cat]["label"]
            print(f"\n  {cat_label}")
        status = "✓" if r["found"] else "✗"
        pts = f"+{r['points_max']}pts" if not r["found"] else f" {r['points_earned']}pts"
        print(f"    {status} {r['label']:<40} {pts}")
        if r["found"] and r.get("files"):
            for f in r["files"][:3]:
                print(f"        → {f}")
        elif r.get("evidence"):
            print(f"        {r['evidence']}")
    print()

    if data["missing"]:
        print("── Top Improvements ────────────────────────────")
        for i, m in enumerate(data["missing"][:5], 1):
            print(f"  {i}. [{m['category']}] {m['label']} (+{m['points_available']} pts)")
            print(f"     {m['description']}")
        print()


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    result = score_repo(path)

    # Always write JSON to stdout so the agent can parse it
    if "--json" in sys.argv:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)
        # Also print JSON at the end for programmatic consumption
        print("── Raw JSON ────────────────────────────────────")
        print(json.dumps(result, indent=2))
