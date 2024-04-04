# git-semver
Easily add semantic versioning to all your git repositories, and integrate the versioning into your apps.

The git-semver mantra:

   Automatically tag your code with a semantic version every time you push

Git-semver facilitates semantic versioning of git repositories.
Following semantic versioning guidelines, developers can tag 
major/minor/patch releases without knowing numeric tag details.
Instead, the developer can focus on whether commits since the last tag 
include breaking changes (major), addition of new functionality (minor), 
or bugfixes (patch).  

To painlessly kick things off, just start using git-sync to push your changes.
This automatically applies semantic version tags to your code, starting with v0.0.0.
Use --major when pushing breaking changes, and --minor when pushing new features.
Other than that, it should all be automatic.

In more complex continuously automated environments, git-semver provides a framework
for you to stamp the "next version" into your code base right before pushing.
Best practice is to create an app-specific "stamp" script for your app, and use it for every commit.
Any type of app is supported, through a generic callback; npm module publishing is also supported.
See git-semver-sync-cmd.js for a complete example that is used to publish git-semver itself.

git-sync is the primary command.  It automates version stamping through a rebased push:

  stash, pull --rebase, stash pop, determine "next" version, stamp, commit, tag, push, publish

git-sync will drop you back to the command line on any conflicts.  Automating this workflow can save hours.

Common commands:

* git-sync                   [--major|--minor|--patch] [msg msg...] > stash, pull, pop, stamp, commit, tag, push
* git-sync-notag             > a git-sync version to commit code without a tag; bad form perhaps, but up to you

* git-log                    [--branch|-b name] [count] > an opinionated pretty colored git log, clipped to ~110 chars
* git-branchlog              [--branch|-b name OR -all|-a] [--with-commits|-c] > an opinionated branch summary log
* git-tag-list               > list tags, including one line from the annotaged tag's commit message

* git-skip                   [file] > tell git to start ignoring upstream and local changes to the given file
* git-noskip                 [file] > tell git to stop ignoring upstream and local changes to the given file
* git-skiplist               > list the files for which git is currently ignoring upstream and local changes

* npm-update-version         [version] > inject the current version into package.json
* git-semver-sync            [--major|--minor] [msg msg...] > dogfooding 101: use git-semver to publish git-semver

* list-commands              lists all available commands


See https://bitpost.com/news for more bloviating.  Devs don't need no stinkin ops.   Happy automating!  :-)


Most recent commits...
  4dae181 2 months ago Allow for larger hashes in git-log                    HEAD -> mas.. Michael Behrns-Miller [cast]
  59a7392 8 months ago dep crawl                                               tag: 0.0.32 Michael Behrns-Miller [abt..
  2dd3df4 8 months ago Minor npm deps ripple                                   tag: 0.0.31 Michael Behrns-Miller [abt..
  acf6986 8 months ago Do not chdir in git_remote_changes                      tag: 0.0.30 Michael Behrns-Miller [abt..

Version 0.0.34
