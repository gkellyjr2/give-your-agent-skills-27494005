---
name: repo-readiness
description: >
  Evaluates whether a repository is ready for AI-assisted development and guides the user on improvements.
  Use this skill whenever a user asks about AI-readiness, wants to know if their repo is set up for Copilot/Claude/Cursor, asks "how can I improve my repo for AI", mentions AGENTS.md or copilot-instructions.md in a setup context, or wants to add AI workflow artifacts to a project.
  This skill runs a deterministic scoring script, then explains the results and helps create missing files.
---

# Repo Readiness

This skill scores a repository for AI-assisted development readiness, explains the results, and helps the user create the highest-impact missing artifacts.

## How it works

Scoring is **deterministic** — always run the script; never estimate the score yourself. The agent's job is to run the script, make the numbers human-readable, and then guide the user toward improvements.

---

## Step 1 — Run the scoring script

Find the script relative to this SKILL.md:

```bash
python <skill_dir>/scripts/score_repo.py [repo_path]
```

- `repo_path` defaults to `.` (current directory). Use the actual repo root if it's different.
- The script prints a human-readable report **and** a JSON block at the end.

Parse the JSON. Everything downstream uses the JSON; the printed report is for the user to read in the terminal.

---

## Step 2 — Present the results

After the script runs, surface the results clearly in chat. A good structure:

1. **Score & Tier** — headline number and what tier it falls into.
2. **Category breakdown** — a brief sentence per category (Agent Context, Rules & Instructions, Repeatable Workflows) noting what was found and what's missing.
3. **Top 3 improvements** — the highest-point missing signals, explained in plain language, with an offer to help create them.

Keep it concise. The terminal output already has the full detail; your role in chat is to interpret it and make it actionable.

### Tier meanings

| Tier | Score | What it means |
|---|---|---|
| **AI-Ready** | ≥ 80% | Strong foundations. AI agents have context, rules, and workflows. |
| **Developing** | 55–79% | Good start. A few key files will close the gap. |
| **Getting Started** | 30–54% | Foundations exist but agents lack important context. |
| **Not Ready** | < 30% | AI agents have little to work with. Even one good file helps a lot. |

---

## Step 3 — Recommend improvements

For each missing signal in the `missing` array (sorted by impact, highest first), explain:
- **What it is** — in plain language, not jargon
- **Why it helps** — what the agent can do *with* this file that it can't do without it
- **How to get it** — offer to create it right now

Prioritise the top 3 signals. Don't overwhelm the user with a long list.

### Creation guidance per artifact type

Use these templates and guidelines when the user asks you to create a missing file. Adapt content to what you know about the actual repository.

#### AGENTS.md

Purpose: A README for AI agents. Tells them what the project does, how it's structured, key conventions, and what's off-limits.

Minimum useful content:
```markdown
# AGENTS.md

## Project overview
[What this project does and who uses it]

## Repository structure
[Key directories and what they contain]

## Development workflow
[How to build, test, run the project]

## Conventions
[Coding style, naming, branching, commit message format]

## Notes for AI agents
[Anything the agent should be especially careful about — e.g., files not to edit, external services, sensitive areas]
```

#### CLAUDE.md

Purpose: Project-specific instructions for Claude. Can overlap with AGENTS.md but is often more focused on how Claude should *behave* in this codebase.

Structure mirrors AGENTS.md but can include Claude-specific preferences (e.g., "always run tests before declaring a task done", "don't refactor unless asked").

#### .github/copilot-instructions.md

Purpose: Customises GitHub Copilot's inline suggestions and chat behaviour across the repo.

Good content to include:
- The tech stack and major frameworks in use
- Preferred patterns (e.g., "use async/await not callbacks")
- File/folder conventions
- What *not* to suggest (e.g., deprecated APIs)

```markdown
# Copilot Instructions

This is a [language/framework] project. When making suggestions:
- [Key pattern or preference]
- [Another preference]
- [What to avoid]
```

#### .cursorrules / .cursor/rules

Purpose: Project rules for Cursor IDE. Similar to copilot-instructions.md.

Keep it as a concise list of rules in plain text or markdown. Cursor reads this before every generation.

#### SKILL.md (workflow file)

Purpose: Packages a repeatable AI workflow so it can be invoked consistently across the team.

Point the user to the skill-creator skill if they want to build a proper SKILL.md from scratch.

#### .prompt.md files

Purpose: Reusable prompt templates saved in the repo so the whole team can invoke the same high-quality prompts.

Typical home: `.github/prompts/` or `.vscode/prompts/`

```markdown
---
mode: agent
description: [What this prompt does]
---

[Prompt content here]
```

---

## Step 4 — Help create artifacts

If the user says yes to creating a file:

1. Read enough of the repo (README, package.json, directory listing, etc.) to write something accurate and useful — don't create a generic placeholder if you can do better.
2. Create the file at the canonical path (e.g., `AGENTS.md` at repo root, `.github/copilot-instructions.md`).
3. After creating, offer to re-run the scoring script so the user can see the updated score.

---

## What the script checks

For reference, here's what each signal looks for:

| Signal | Category | Points | What it checks |
|---|---|---|---|
| AGENTS.md | Agent Context | 15 | `AGENTS.md`, `.github/AGENTS.md`, or `docs/AGENTS.md` |
| CLAUDE.md | Agent Context | 15 | `CLAUDE.md`, `.github/CLAUDE.md`, or `docs/CLAUDE.md` |
| Agent context quality | Agent Context | 10 | Any agent context file has >200 chars of content |
| Copilot instructions | Rules | 15 | `.github/copilot-instructions.md` or `copilot-instructions.md` |
| Cursor rules | Rules | 10 | `.cursorrules` or `.cursor/rules` |
| Other instructions | Rules | 5 | `*.instructions.md` or `.github/instructions/*.md` |
| Rules quality | Rules | 5 | Any rules file has >200 chars of content |
| SKILL.md files | Workflows | 20 | Any `SKILL.md` in the repo |
| Prompt files | Workflows | 10 | Any `*.prompt.md` files |
| Multiple workflows | Workflows | 10 | 3 or more workflow artifacts combined |

**Max score: 115 points**

---

## Edge cases

- **Monorepo**: Run the script from the repo root. The script walks the full tree.
- **Private / sensitive repos**: Remind the user that AGENTS.md and copilot-instructions.md are committed to source control — don't put secrets in them.
- **Already scored before**: If the user ran this once and added some files, just re-run the script. The score will update automatically.
