# @moodboom/git-semver

Public npm library: automated git semantic versioning CLI system.

## Architecture
- **index.js**: re-exports gsv.js and version-control.js
- **version-control.js**: core library — version parsing, git operations, sync workflow
- **gsv.js**: CLI handler for `gsv sync`/`gsv update` (self-publishing)
- **\*-cmd.js** (19 files): bin entry points for each CLI command

## Key Functions (version-control.js)
- `git_sync(folder, tag_params, stamp_callback)` — main workflow: stash, pull --rebase, pop, stamp, commit, tag, push. Its "nothing to do" bailout also checks for unpushed local commits (`HEAD@{u}..HEAD`), so a clean tree with a pending commit still gets pushed (no new commit/tag).
- `git_version()` / `git_version_clean()` — get current version from `git describe`
- `next_major/minor/patch/build(desc)` — compute next version from a version string
- `get_npm_adjusted_version(version)` — ensure version exceeds package.json version
- `npm_update_version(version)` — stamp version into package.json
- `parse_tag_parameters(argv)` — parse CLI flags (--major, --minor, --pull-only, --branch, etc.)
- `git_skip/noskip/skiplist` — manage skip-worktree files
- `git_log`, `git_branchlog`, `git_tag_list` — pretty columnar git output (auto-sized columns via awk, tag-only decorations)
- `git_clone`, `git_changes`, `git_remote_changes` — git utilities

## Dependencies
- `rad-scripts` — shell execution, filesystem ops (circular dependency, works via npm deduplication)
- `window-size` — terminal width detection for `git_log`/`git_tag_list` column formatting

## Git Workflow
- Always commit and push with: `mh sp <commit message>` (sync-project — scoped to this repo; runs `gsv sync`, which also publishes the npm module). `mh s` is the optional all-repos sweep.
- On commit: compress context, update CLAUDE.md with completed changes, then run `mh sp <message>` to commit and push

## Publishing
- Published to npm as `@moodboom/git-semver`
- `mh sp <comment>` (here) commits, tags, pushes, and publishes in one step; `mh s` does the same as part of an all-repos sweep
- `files` field in package.json controls what gets published
- `package-lock.json` is gitignored (library, not app)
- **npm auth**: a granular access token (bypass-2FA, read+write, scopes `@moodboom` + `@a-better-software`, package `rad-scripts` — unscoped packages must be listed individually) lives ONLY in cast's `~/.npmrc` (local, unstowed, uncommitted; set with `npm config set //registry.npmjs.org/:_authToken <t>`, verify with `npm whoami`). Publishing from any other host fails at the npm step only (git commit/tag/push still succeed). Token expires about 2027-01-20 (90-day max); renew at npmjs.com/settings/moodboom/tokens. No expiry date is hard-coded anywhere.
- **Publish result reporting (gsv.js)**: a failed `npm publish` prints renewal steps and sets exit code 1 (the trailing `npm install -g` still runs). A successful one polls `npm view <pkg>@<ver> --prefer-online` every 15s for up to 3 min, because the registry routinely takes 1–2.5 min to list a fresh version; only after that does it say "most likely STAGED, approve at the package page". Never shorten the wait — a short check falsely reports staged.
- **npm 2FA-bypass deprecation (decided: stage-and-approve)**: from about January 2027 bypass tokens can only STAGE a publish; it goes public after a human 2FA approval on npmjs.com. Owner chose to keep `gsv sync` as is and approve each release by hand. Rejected: CI trusted publishing over OIDC (repos live on self-managed GitLab, which npm trusted publishing did not support) and interactive OTP on publish (hangs headless `mh sp` runs).

## Testing
- `npm test` runs `node test.js` (29 tests, no framework)
- Tests cover: version validation, next_major/minor/patch/build, folder-from-url, parameter parsing, git_version (live), npm version adjustment, regex safety

## Version Regex Patterns
- All version regexes use escaped dots: `/([0-9]*)\.([0-9]*)\.([0-9]*)/`
- `next_build` uses `-([0-9]+)` to capture the build number after the dash separator
- All `next_*` functions have null guards for non-matching input (return `"unknown version"`)

## Security
- `git_skip`/`git_noskip` quote file arguments
- `git_clone` quotes repo URL and folder arguments
- Shell command strings (commit messages, folder paths) are still interpolated — callers should not pass untrusted input

## Conventions
- ES modules (`"type": "module"`)
- Consistent whitespace style: spaces inside parens/brackets, 2-space indent
- No linter configured
- `var` still used in some older functions; prefer `const`/`let` for new code

## .gitignore
- `node_modules`
- `package-lock.json`
