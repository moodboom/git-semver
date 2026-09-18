# git-semver — agent notes (OpenCode, open-source models)
Public npm library and CLI for automated git semantic versioning: `version-control.js` (core: version parsing, git sync workflow), `gsv.js` (CLI), and one `*-cmd.js` entry point per command. ES modules.

## Test
- `npm test` runs `node test.js` (no framework). Version regexes use escaped dots; every `next_*` function guards non-matching input.
- Shell strings (commit messages, paths) are interpolated in places: keep new code quoting arguments.
- Publishing happens through `mh sp` (which the human runs); never bump the version or publish.

## Boundaries (read first)
- `CLAUDE.md`, the `.claude/` directory, `ToDo.txt` and `Archive.txt` belong to a DIFFERENT agent (Claude Code) and its journal workflow. Do not read, quote, or edit them, even if asked to "read the skill". Your instructions are this file only.
- Your context window is small (32k). Read files narrowly (grep, then the lines you need). Do not read whole large files or directories.
- Git: change only what the task needs; `git add` those files and commit with a short message. Never push, never rebase, never run `mh` (it syncs and can publish). The human pushes.
- Never touch credentials, tokens, `wp-config.php`, `/root`, or anything under `~/.config/mah-haus`.
- Keep answers short and concrete. Say when you are unsure instead of guessing.
