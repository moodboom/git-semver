#!/usr/bin/env node

import { writeFileSync } from 'fs';

import { 
  run_command_sync_to_console, 
  run_command_quietly,
  run_command_sync,
  folder_exists, 
  runsteps, 
  string_pad,
} from 'rad-scripts';

import {
  git_changes,
  git_sync,
  npm_update_version,
  parse_tag_parameters,
} from './version-control.js';

// This script defines the top-level command of git-semver.
// It requires a second sub-command.
// Type [gsv] for usage.
//
// NOTE: Substeps can typically be run directly, via binaries defined in package.json that call the corresponding '-cmd.js' scripts.
// But we always provide access to all available substeps here too, to stay organized, centralized and documented.

export const gsv = ( target, args ) => {
  if ( target == 'update' || target == 'up' ) {

    const run_cmd = `git pull && npm install && npm link`;
    run_command_sync_to_console( run_cmd );
    
  } else if ( target == 'sync' || target == 'sy' ) {
    
    if ( !folder_exists( '../git-semver' ) ) {
      console.log( `You should sync from the repo root folder.` );
      exit( 1 );
    }
    
    const tagParams = parse_tag_parameters( args, 1 ); // noslice = 1
    
    // git_sync to commit and tag a new version as appropriate.
    const stampCallbackFunction = ( err, version ) => {
      if ( err ) throw err;
      const adjustedVersion = npm_update_version( version );
    
      // Quietly reinstall, so we get any recently-made changes to usage.
      run_command_quietly( 'npm install -g' );
    
      // Directly update README.md with usage, whoop
      let readme = run_command_sync( 'gsv' );
    
      // Let's add the version, and the most recent commits, to the readme, for fun.
      // Note that usage will not include this, only the README.md file.
      // But it should be visible on github/npm.
      readme += "\n\nMost recent commits...\n";
      readme += run_command_sync( 'git-log 4' )
      readme += "\nVersion " + version;
      readme += "\n";
    
      const filename = 'README.md';
      writeFileSync( filename, readme, 'utf-8' );
      return adjustedVersion;
    };
    
    // SYNC and PUBLISH CHANGES
    const changes = git_changes( process.cwd() );
    git_sync( process.cwd(), tagParams, stampCallbackFunction );
    if ( changes ) {
      // There were changes, so let's publish now.
      run_command_sync_to_console( 'npm publish --access public' );
    }
    
    // Quietly reinstall, so we get any recently-made remote changes.
    run_command_quietly( 'npm install -g' );
    
  } else {

    // Log usage

    const cmds = [
      { name: 'git-sync'                  , desc: '[--major|--minor|--patch] [msg msg...] > best-practice-merge-and-tag any repo in one step\n' +
                                                  'with this flow: stash, pull, pop, stamp, commit, tag, push'                                },
      { name: 'git-sync-notag'            , desc: 'a git-sync version to commit code without a tag; bad form perhaps, but up to you'          },
      { name: 'get-npm-adjusted-version'  , desc: 'this ensures stamped version is bumped beyond version in package.json\n'    },
    
      { name: 'git-log'                   , desc: '[--branch|-b name] [count] > an opinionated pretty colored git log, clipped to ~110 chars' },
      { name: 'git-branchlog'             , desc: '[--branch|-b name OR -all|-a] [--with-commits|-c] > an opinionated branch summary log'     },
      { name: 'git-tag-list'              , desc: '> list tags, including one line from the annotaged tag\'s commit message\n'                },
    
      { name: 'git-skip'                  , desc: '[file] > tell git to start ignoring upstream and local changes to the given file'          },
      { name: 'git-noskip'                , desc: '[file] > tell git to stop ignoring upstream and local changes to the given file'           },
      { name: 'git-skiplist'              , desc: '> list the files for which git is currently ignoring upstream and local changes\n'         },
    
      { name: 'npm-update-version'        , desc: '[version] > inject the current version into package.json\n'                                },
    
      { name: 'gsv sync'                  , desc: '[--major|--minor] [msg msg...] > dogfooding 101: use git-semver to publish git-semver'     },
      { name: 'gsv update'                , desc: 'update the local install of git-semver\n'                                                  },

      { name: 'list-commands'             , desc: 'lists all available commands\n'                                                            },
      // NOTE These minor commands only get displayed when list-commands is used.
      { name: 'git-version'               , desc: 'returns the current git semantic version, based on [git describe]'                       },
      { name: 'git-version-clean'         , desc: 'returns MAJOR.MINOR.PATCH git version (suffix stripped)\n'                               },
      { name: 'git-next-major'            , desc: 'returns what would be the next MAJOR semantic version'                                   },
      { name: 'git-next-minor'            , desc: 'returns what would be the next MINOR semantic version'                                   },
      { name: 'git-next-patch'            , desc: 'returns what would be the next PATCH semantic version'                                   },
      { name: 'git-next-build'            , desc: 'returns what would be the next BUILD semantic version (less common)\n'                   },
    
      { name: 'get-svn-rev'               , desc: 'parses and returns the svn current revision from [svn info]'                             },
      { name: 'get-svn-last-changed-rev'  , desc: 'parses and returns the svn last-changed revision from [svn info]\n'                      },
    
    ];
    
    for ( let i = 0; i < cmds.length; i++ ) {
      if ( args[ 0 ] == cmds[ i ].name && cmds[ i ].name != 'list-commands' ) {
        const steps = [{ name: cmds[ i ].name, folder: '.', cmd: cmds[ i ].name }];
        runsteps( steps );
      }
    }
    
    // Generate usage, including a full app description, as this will be dynamically used to create README.md.  All docs in one place!  Cool.
    if ( args[ 0 ] != 'list-commands' ) {
      console.log(
        '# git-semver\n' +
            `An automated git semantic versioning command line system to optimize any developer's git workflow.  Shave off hours of git tedium.\n\n` +

            '* Easily add semantic versioning to all your git repositories, and integrate the versioning into your apps.' +
            '* Includes support for automated semver publishing of node modules.' +
            '* Also includes extended tooling for git, including pretty log output.\n\n' +
    
            'Common usage:' +
            '  git-sync [--major|--minor] My commit message\n' +
        
            'The git-semver mantra:\n' +
            '\n' +
            '   Automatically tag your code with a semantic version every time you push\n' +
            '\n' +
            'Git-semver facilitates semantic versioning of git repositories.\n'+
            'Following semantic versioning guidelines, developers can tag \n' +
            'major/minor/patch releases without knowing numeric tag details.\n' +
            'Instead, the developer can focus on whether commits since the last tag \n' +
            'include breaking changes (major), addition of new functionality (minor), \n' +
            'or bugfixes (patch).  \n' +
            '\n' +
            'To painlessly kick things off, just start using git-sync to push your changes.\n'+
            'This automatically applies semantic version tags to your code, starting with v0.0.0.\n' +
            'Use --major when pushing breaking changes, and --minor when pushing new features.\n' +
            'Other than that, it should all be automatic.\n' +
            '\n' +
            'In more complex continuously automated environments, git-semver provides a framework\n' +
            'for you to stamp the "next version" into your code base right before pushing.\n' +
            'Best practice is to create an app-specific "stamp" script for your app, and use it for every commit.\n' +
            'Any type of app is supported, through a generic callback; npm module publishing is also supported.\n' +
            'See git-semver-sync-cmd.js for a complete example that is used to publish git-semver itself.\n' +
            '\n' +
            'git-sync is the primary command.  It automates version stamping through a rebased push:\n' +
            '\n' +
            '  stash, pull --rebase, stash pop, determine "next" version, stamp, commit, tag, push, publish\n' +
            '\n' +
            'git-sync will drop you back to the command line on any conflicts.  Automating this workflow can save hours.\n' +
            '\n' +
            `NOTE you don't have to quote your commit message if it is standard text.  Messages with [-?&|'] etc. should be quoted.\n` +
            '\n' +
            'Common commands:\n',
      );
    }
    for ( var i = 0;i < cmds.length;i++ ) {
      console.log( '* '+string_pad( '                           ',cmds[ i ].name )+cmds[ i ].desc );
    
      // Stop after 'list-commands' if we are not listing all commands.
      if ( cmds[ i ].name == 'list-commands' ) 
        if ( args[ 0 ] != 'list-commands' )
          break
    }
    
    if ( args[ 0 ] == 'list-commands' ) {
      console.log(
        '\n'+
            'Utilities include:\n'+
            '\n'+
            '* ' +string_pad( '                    ','version-control' )  +'> git semantic versioning via tags; sync git repos (auto commit+pull+push); extract svn revisions\n',
      );
    }
    
    console.log(
      '\n'+
        'See https://bitpost.com/news for more bloviating.  Devs don\'t need no stinkin ops.   Happy automating!  :-)\n\n',
    );
  }
}
