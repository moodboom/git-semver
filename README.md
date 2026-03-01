# git-semver
An automated git semantic versioning command line system to optimize any developer's git workflow.  Shave off hours of git tedium.

* Easily add semantic versioning to all your git repositories, and integrate the versioning into your apps.
* Includes support for automated semver publishing of node modules.
* Also includes extended tooling for git, including pretty log output.

Common usage:  git-sync [--major|--minor] My commit message

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

NOTE you don't have to quote your commit message if it is standard text.  Messages with [-?&|'] etc. should be quoted.

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


See https://bitpost.com/news for more bloviating.  Happy automating!  :-)




Most recent commits...
  6105794 16 minutes.. Vet fixes: fix ping command injection and return va.. HEAD -> mai..                   MDM [cast]
  894dea3 3 months ago README updated                                           tag: 5.0.8 Michael Behrns-Miller [cast]
  2bbe235 3 months ago README updated                                           tag: 5.0.7 Michael Behrns-Miller [cast]
  5fefffa 3 months ago README update                                            tag: 5.0.6 Michael Behrns-Miller [cast]

Version 5.0.10
