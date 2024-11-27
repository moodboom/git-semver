# git-semver
Easily add semantic versioning to all your git repositories, and integrate the versioning into your apps.

Common usage:  git-sync [--major|--minor] msg msg "msg with these [-?&|] should be quoted"
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

* git-sync                   [--major|--minor|--patch] [msg msg...] > best-practice-merge-and-tag any repo in one step
with this flow: stash, pull, pop, stamp, commit, tag, push
* git-sync-notag             a git-sync version to commit code without a tag; bad form perhaps, but up to you
* get-npm-adjusted-version   this ensures stamped version is bumped beyond version in package.json

* git-log                    [--branch|-b name] [count] > an opinionated pretty colored git log, clipped to ~110 chars
* git-branchlog              [--branch|-b name OR -all|-a] [--with-commits|-c] > an opinionated branch summary log
* git-tag-list               > list tags, including one line from the annotaged tag's commit message

* git-skip                   [file] > tell git to start ignoring upstream and local changes to the given file
* git-noskip                 [file] > tell git to stop ignoring upstream and local changes to the given file
* git-skiplist               > list the files for which git is currently ignoring upstream and local changes

* npm-update-version         [version] > inject the current version into package.json

* gsv sync                   [--major|--minor] [msg msg...] > dogfooding 101: use git-semver to publish git-semver
* gsv update                 update the local install of git-semver

* list-commands              lists all available commands


See https://bitpost.com/news for more bloviating.  Devs don't need no stinkin ops.   Happy automating!  :-)




Most recent commits...
  92dc5a7  3 hours ago Add npm version check See get_npm_adjusted_version    HEAD -> mas.. Michael Behrns-Miller [cob..
  1375638 18 hours ago Log git sync errors                                      tag: 1.0.0 Michael Behrns-Miller [cob..
  ade7218   2 days ago Bump to fix circular dep                                tag: 0.0.40 Michael Behrns-Miller [cob..
  a3782db   2 days ago Refactor for consistency ES6-ishness and module ref..               Michael Behrns-Miller [cob..

Version undefined
