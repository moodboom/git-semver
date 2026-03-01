# @moodboom/git-semver

Public npm library: automated git semantic versioning CLI system.

## Architecture
- **index.js**: re-exports gsv.js and version-control.js
- **version-control.js**: core library — version parsing, git operations, sync workflow
- **gsv.js**: CLI handler for `gsv sync`/`gsv update` (self-publishing)
- **\*-cmd.js** (19 files): bin entry points for each CLI command

## Key Functions (version-control.js)
- `git_sync(folder, tag_params, stamp_callback)` — main workflow: stash, pull --rebase, pop, stamp, commit, tag, push
- `git_version()` / `git_version_clean()` — get current version from `git describe`
- `next_major/minor/patch/build(desc)` — compute next version from a version string
- `get_npm_adjusted_version(version)` — ensure version exceeds package.json version
- `npm_update_version(version)` — stamp version into package.json
- `parse_tag_parameters(argv)` — parse CLI flags (--major, --minor, --pull-only, --branch, etc.)
- `git_skip/noskip/skiplist` — manage skip-worktree files
- `git_log`, `git_branchlog`, `git_tag_list` — pretty git output
- `git_clone`, `git_changes`, `git_remote_changes` — git utilities

## Dependencies
- `rad-scripts` — shell execution, filesystem ops (circular dependency, works via npm deduplication)
- `window-size` — terminal width detection for `git_log` column formatting

## Publishing
- Published to npm as `@moodboom/git-semver`
- `mh s <comment>` commits, tags, pushes, and publishes in one step
- `files` field in package.json controls what gets published
- `package-lock.json` is gitignored (library, not app)

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
