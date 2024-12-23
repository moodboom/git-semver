#!/usr/bin/env nodeold

import { normalize } from 'path';
import { exec, execSync } from 'child_process';
import * as windowsize from 'window-size';
import { readFileSync, writeFileSync } from 'fs';
import {
  run_command_sync,
  run_command_sync_to_console,
  combine_params,
} from 'rad-scripts';

const unknown_version = 'unknown version';


//=========== git_version_valid: tests to see if a version is valid ============
export const git_version_valid = version => {

  if ( version == null )
    return false;

  // If this doesn't start with a number then a dot, we won't know what to do...
  if ( version.match( /^[0-9]\./ ) == null )
    return false;

  return true;
}


// =========== git_version: gets the git version, using [git describe], which includes tag, commit count, and current hash prefix, as a string ============
export const git_version = () => {

  let desc = run_command_sync( 'git describe --always --tags' ).trim();

  if ( !git_version_valid( desc ) ) {

    console.log( "No semantic version tag found, creating 0.0.0..." );
    const tagattempt = run_command_sync( 'git tag -a -m "rad-scripts auto-created initial tag" 0.0.0' );
    desc = run_command_sync( 'git describe --always --tags' ).trim();

    // If we still don't have a valid version, it's likely that the repo has just been created.
    // The user will need to commit first to create HEAD.
    // We COULD try committing... but that is fraught with peril to do right here...
    if ( !git_version_valid( desc ) ) {
      console.log( "Unable to tag - perhaps you need to make an initial commit first to actually create HEAD.\nOutput:\n" + tagattempt + "\n" );
      return unknown_version;
    }
  }

  return desc;
}


// =========== git_version_clean: gets the git version stripped to MAJOR.MINOR.PATCH ============
export const git_version_clean = () => {

  const desc = git_version();
  if ( desc == unknown_version ) return desc;

  const tokens = desc.match( /(^[0-9]*.[0-9]*.[0-9]*)/ );
  if ( tokens != null )
    return tokens[ 1 ];

  return desc;
}


//=========== git_changes: gets any changes in the current folder; returns blank if none ============
export const git_changes = folder => {
  // NOTE:  rebase pull will take care of recent commits that have not been pushed yet.
  const changes = run_command_sync( `cd ${folder} && git status -uno --porcelain` );
  return changes;
}


//=========== git_remote_changes: returns if remote changes exist, blank if none ============
// NOTE we exit on error.  Need to stop and let the user fix connectivity before we plow ahead.
export const git_remote_changes = folder => {
  const updateOkay = run_command_sync( `cd ${folder} && git remote update >/dev/null 2>&1 || echo fail` ).trim();
  if ( updateOkay === 'fail' ) {
    console.log( `[git remote update] failed, please check your git remote connectivity.` );
    process.exit( 1 );
  }
  return run_command_sync( `cd ${folder} && git log HEAD..HEAD@{u} --oneline` );
}


// NOTE: These are used by git-sync to determine the "next" version.

// =========== git_next_major ============
export const next_major = desc => {
  const tokens = desc.match( /([0-9]*).*/ );
  const major = parseInt( tokens[ 1 ] ) + 1;
  if ( major == null ) return unknown_version;

  return major + ".0.0";
}
export const git_next_major = () => {
  const desc = git_version();
  if ( desc == unknown_version ) return desc;
  return next_major( desc );
}


// =========== git_next_minor ============
export const next_minor = desc => {
  const tokens = desc.match( /([0-9]*).([0-9]*)/ );
  const major = tokens[ 1 ];
  const minor = parseInt( tokens[ 2 ] ) + 1;
  if ( major == null || minor == null ) return unknown_version;

  return major + "." + minor + ".0";
}
export const git_next_minor = () => {
  const desc = git_version();
  if ( desc == unknown_version ) return desc;
  return next_minor( desc );
}


// =========== git_next_patch ============
export const next_patch = desc => {
  const tokens = desc.match( /([0-9]*).([0-9]*).([0-9]*)/ );
  const major = tokens[ 1 ];
  const minor = tokens[ 2 ];
  const patch = parseInt( tokens[ 3 ] ) + 1;
  if ( major == null || minor == null || patch == null ) return unknown_version;

  return major + "." + minor + "." + patch;
}
export const git_next_patch = () => {

  const desc = git_version();
  if ( desc == unknown_version ) return desc;
  return next_patch( desc );
}


// =========== git_next_build (DEPRECATED in most use cases): gets the git version, then strips hash and increments the commit count by one ============
export const next_build = desc => {
  // First we check to see if we are sitting right on a tag, eg [1.2.3].  If so, return [1.2.3-1].
  let tokens = desc.match( /(^[0-9]*.[0-9]*.[0-9]*$)/ );
  if ( tokens != null )
    return tokens[ 1 ] + "-1";

  tokens = desc.match( /(^[0-9]*.[0-9]*.[0-9]*)(.[0-9]*).*/ );

  if ( tokens == null || tokens[ 2 ] == null )
    return unknown_version;

  // Now turn [1.2.3-4-g#######] into [1.2.3-5]...
  const build = parseInt( tokens[ 2 ] ) + 1;
  return tokens[ 1 ] + build;
}
export const git_next_build = () => {

  const desc = git_version();
  if ( desc === unknown_version ) return desc;
  return next_build( desc );
}


// =========== get_npm_adjusted_version ============
export const get_npm_adjusted_version = version => {
  // We are given a version that we are about to apply.
  // Before we do so, for node modules, we will want to ensure
  // that the new version is actually higher than any
  // npm module version in package.json.
  // Most of the time this isn't a problem, and we simply return the version we were given.
  // But if there were versions that were manually published, we don't want to clash.

  const filename = 'package.json';
  try {
    const packageFileString = readFileSync( filename, 'utf8' );
    const p = JSON.parse( packageFileString );
    const packageVersion = p.version;

    const packageTokens = packageVersion.match( /([0-9]*).([0-9]*).([0-9]*).*/ );
    const versionTokens = version.match( /([0-9]*).([0-9]*).([0-9]*).*/ );
    if (
      parseInt( packageTokens[ 1 ] ) > parseInt( versionTokens[ 1 ] ) 
      || (
        parseInt( packageTokens[ 1 ] ) === parseInt( versionTokens[ 1 ] ) 
        && parseInt( packageTokens[ 2 ] ) > parseInt( versionTokens[ 2 ] )
      ) || (
        parseInt( packageTokens[ 1 ] ) === parseInt( versionTokens[ 1 ] ) 
        && parseInt( packageTokens[ 2 ] ) === parseInt( versionTokens[ 2 ] )
        && parseInt( packageTokens[ 3 ] ) >= parseInt( versionTokens[ 3 ] )
      )
    ) {
      const adjustedVersion = `${packageTokens[ 1 ]}.${packageTokens[ 2 ]}.${parseInt( packageTokens[ 3 ] ) + 1}`;
      console.log( `The npm package version [${packageVersion}] is greater than the next git tag (${version}).` );
      console.log( `Target version has been incremented to ${adjustedVersion}.` );
      return adjustedVersion;
    }
  }
  catch ( err ) {
    console.log( `get_npm_adjusted_version error:\n${err}\n` );
    process.exit( 1 );
  }
  return version;
}


// =========== git_sync ============
// NOTE: This follows the rad-scripts mantra of semver-tagging every push.
//
// We consider the following flows here.
//
// 1) commit, pull --rebase, determine "next" version, stamp, commit, tag, push, publish
// This process is thorough but would often result in two commits.
// Also, if you committed local changes somewhere else they'll be screwed by rebase
// (but that would be uncommon).
// See http://stackoverflow.com/questions/2472254/when-should-i-use-git-pull-rebase
//
// 2) pull, determine "next" version, stamp, commit, tag, push, publish
// Best practice is to pull before starting work, and finish before others push.  Not always possible.  :-)
// So this process can result in merges when there were remote changes - but that's the cost of doing business.
// The problem is the pull - it won't happen if changes are not committed first.
//
// 3) determine "next" version using local and remote tags, stamp, commit, pull --rebase, tag, push, publish
// This process is does everything we need.
// The difficulty is in implementing the first step.
//
// 4) stash, pull --rebase, stash pop, determine "next" version, stamp, commit, tag, push, publish
// This is just as good as 3 and is easier.  It does everything we need, well, for the typical commit.
//
// We will go with the fourth.
//
export const git_sync = ( folder, tag_params, stamp_callback_function ) => {
  let blip = "";
  try {

    process.chdir( normalize( folder ) );

    let changes = git_changes( folder );

    let remote_changes = git_remote_changes( folder );
    if ( changes ) {
      changes = ( changes.length > 0 );
    }
    if ( remote_changes ) {
      remote_changes = ( remote_changes.length > 0 );
    }

    const any_changes = changes || remote_changes;

    // Currently we bail out before printing "---" blip, as it's fairly chatty.
    if ( !any_changes ) {
      // There may be more to do after we return, doh!
      // process.exit(0);

      return 0;
    }

    // Build blip.
    if ( changes && remote_changes && !tag_params.pull_only ) { blip = '<=>'; }
    else if ( changes && !tag_params.pull_only ) { blip = '>>>'; }
    else if ( remote_changes ) { blip = '<<<'; }
    else { blip = '---'; }

    // We can't get the version here because we haven't done a pull yet and we don't yet know what it will be.     
    // if (git_version_valid(version)    ) { blip += ' ['+version+']'; }

    console.log( '----------------------------------' );
    console.log( blip + ' ' + folder );
    console.log( '----------------------------------' );

    // If comment is anything other than blank, build a proper comment format that we can slap on the end of cmd.
    let comment = tag_params.comment;
    if ( comment.length > 0 ) {
      comment = " -m \"" + comment + "\"";
    }

    if ( changes && remote_changes ) {
      // Why did we originally use --keep-index here?
      // run_command_quietly('git stash --keep-index');
      run_command_sync_to_console( 'git stash' );
    }

    // See note in function header regarding --rebase
    if ( remote_changes ) {
      run_command_sync_to_console( 'git pull --rebase' );
    }

    if ( changes && remote_changes ) {
      run_command_sync_to_console( 'git stash pop' );
    }

    // We are now ready to push.  Bail out if we only wanted pull.
    if ( tag_params.pull_only )
      return 0;

    if ( changes ) {
      if ( tag_params.notag ) {

        // Just commit, no tag work at all.
        run_command_sync_to_console( 'git commit -a' + comment );

      } else {

        // Now we can get the "next" version.
        // We had to wait until after the pull,
        // since there may have been newer REMOTE version tags.
        let version;
        if ( tag_params.major ) { version = git_next_major(); }
        else if ( tag_params.minor ) { version = git_next_minor(); }
        else { version = git_next_patch(); }
        if ( !git_version_valid( version ) ) {
          console.log( "Can't determine 'next' version of current tag..." );
          process.exit( 1 );
        }

        // Here is where we would do any version stamping into whatever product or app we are supporting.
        // This is very app-specific, so we expect an (optional) callback function to get it done, if desired.
        // See docs or node modules like rad-scripts for more info.
        if ( stamp_callback_function ) {
          // We don't want to throw an error, so we pass null for the error argument
          // See: http://stackoverflow.com/questions/19739755/nodejs-callbacks-simple-example
          version = stamp_callback_function( null, version );
        }

        // Make sure your editor waits before returning if you want to be able to provide comments on the fly.
        // TODO get on-the-fly commit message and use as the tag message.  Right now we prompt twice.

        // Commit
        run_command_sync_to_console( 'git commit -a' + comment );

        // Tag
        run_command_sync_to_console( 'git tag -a' + comment + ' ' + version );
      }
    }

    // Always push in case we already committed something
    // You should really make [--follow-tags] the default via push.followTags
    run_command_sync_to_console( 'git push --follow-tags' );

    // Erp... this is causing failure in scripts.  We need to return 0 on success.
    // Return true if there were changes.
    // return changes;

    return 0;
  }
  catch ( err ) {
    // NOTE: this is VERY noisy...
    console.log( err );

    // If blip is not set, we had an earlier error in just trying to connect to the repo.
    if ( blip == "" ) {
      console.log( '----------------------------------' );
      console.log( "*** [" + folder + "] WARNING: git-sync could not connect to this repo..." );
      console.log( '----------------------------------' );
    } else {
      console.log( "*** [" + folder + "] WARNING: git-sync did not complete, check repo for conflicts..." );
      console.log( '----------------------------------' );
    }

    return -1;
  }
}


// =========== git_clone: clones a repo ============
export const git_clone = ( remote_repo, local_folder, sync ) => {
  // Make sure the task specifies the full target folder since these may be called async.
  // i.e., don't use process.cwd()...
  const cmd1 = 'git clone ' + remote_repo + ' ' + local_folder;

  const e = sync ? execSync : exec;
  e( cmd1, function ( error, stdout, stderr ) {

    if ( stderr ) {

      if ( stdout.length > 0 ) console.log( stdout );
      console.log( stderr );

    } else {

      console.log( "cloned: " + local_folder );
    }
  } );
}


// =========== git_tag_list: list tags, including 1 line from the annotaged tag's commit message ============
export const git_tag_list = tag_params => {

  let head = 10;
  if ( tag_params.comment != null && tag_params.comment.length )
    head = tag_params.comment

  // get tags, then sort output numerically
  run_command_sync_to_console( "git tag -n|sort -V -r|head -" + head );

  // OLD way, output does not pipe properly if we don't sync_to_console
  // return run_command_sync("git tag -n | sort -n | tail "+message);  <-- doesn't pipe
}


// =========== git_branchlog: show a concise branch merge history ============
export const git_branchlog = tag_params => {

  // branches, prettified; see here:
  //     https://stackoverflow.com/questions/1838873/visualizing-branch-topology-in-git

  let cmd = "git log --graph --oneline"

  // by default we simplify
  // if requested, don't simplify (ie show all commits)
  if ( !tag_params.with_commits )
    cmd += " --simplify-by-decoration"

  // You can specify another branch, OR you can specify --all
  if ( tag_params.all )
    cmd += " --all"
  else if ( tag_params.branch != null && tag_params.branch.length )
    cmd += " " + tag_params.branch

  run_command_sync_to_console( cmd );
}


// =========== git_log: concise pretty log ============
export const git_log = tag_params => {

  // Getting terminal size is nasty, so use a package that works "often" but not always, sigh.
  const { width, height } = windowsize.default || { width: 120, height: 40 };
  const cols = width - 2;
  let head = height - 2;

  if ( tag_params.comment != null && tag_params.comment.length )
    head = tag_params.comment
  let branch = ""
  if ( tag_params.branch != null && tag_params.branch.length )
    branch = tag_params.branch

  const hash = 9; // was 7; minimum hash gets bigger with more commits
  let time, tag, who, comm;
  if ( cols < 70 ) {
    time = tag = who = 6;
    comm = cols - hash - time - tag - who - 3;
    if ( comm < 1 ) {
      console.log( `Can't fit` );
      exit( 1 );
    }
  } else {
    time = 12;
    tag = 13;
    who = 28;
    comm = cols - hash - time - tag - who - 3;
  }
  // get log, prettified; see here:
  //     http://stackoverflow.com/questions/1441010/the-shortest-possible-output-from-git-log-containing-author-and-date
  run_command_sync_to_console(
    `git log ${branch} `
    + `--pretty="%>(${hash},trunc)%h %C(auto,blue)%>(${time},trunc)%ad %C(auto,reset)%<(${comm},trunc)%s %C(auto,red)%>(${tag},trunc)%D %C(auto,white)%>(${who},trunc)%an" `
    + `--date=relative -${head}`,
  );
}


//=========== git_skip: tell git to start ignoring upstream and local changes to the given file ============
export const git_skip = file => {
  run_command_sync_to_console( "git update-index --skip-worktree " + file );
}


//=========== git_noskip: tell git to stop ignoring upstream and local changes to the given file ============
export const git_noskip = file => {
  run_command_sync_to_console( "git update-index --no-skip-worktree " + file );
}


//=========== git_skiplist: list the files for which git is currently ignoring upstream and local changes ============
export const git_skiplist = () => {
  try {
    run_command_sync_to_console( "git ls-files -v . | grep ^S" );
  }
  catch ( err ) {
  }
}


//=========== git_folder_from_url: extract top level folder name ============
export const git_folder_from_url = url => {

  // Get project name out of this:
  // ssh://user@me.com:1000/subdirs/folder.git
  const git_regex = "/([a-zA-Z0-9-]+)([.]git)?$";
  const greg_result = url.match( git_regex );
  if ( greg_result && greg_result[ 1 ] )
    return greg_result[ 1 ];
  else
    return "unknown";
}


// =========== parse_tag_parameters: utility commonly needed to parse tag-based command line parameters ============
export const parse_tag_parameters = ( argv, noslice ) => {

  // Typical node argv sets include [#path#/node #path#/node_cmd param1 param2 ...]
  // By default, we slice off the first two, but some callers do that themselves.
  let args;
  if ( noslice )
    args = argv;
  else
    args = argv.slice( 2 );

  let major = 0;
  let minor = 0;
  let pull_only = 0;
  let with_commits = 0;
  let all = 0;
  let branch = "";

  // Check for "first" params.
  if ( args[ 0 ] == '--major' || args[ 0 ] == '-j' ) { major = 1; args = args.slice( 1 ); }
  else if ( args[ 0 ] == '--minor' || args[ 0 ] == '-n' ) { minor = 1; args = args.slice( 1 ); }
  else if ( args[ 0 ] == '--pull-only' || args[ 0 ] == '-p' ) { pull_only = 1; args = args.slice( 1 ); }

  if ( args[ 0 ] == '--branch' || args[ 0 ] == '-b' ) { branch = args[ 1 ]; args = args.slice( 2 ); }
  if ( args[ 0 ] == '--with-commits' || args[ 0 ] == '-c' ) { with_commits = 1; args = args.slice( 1 ); }
  if ( args[ 0 ] == '--all' || args[ 0 ] == '-a' ) { all = 1; args = args.slice( 1 ); }
  // Do it again to handle more slot ordering.  Hackery.
  if ( args[ 0 ] == '--branch' || args[ 0 ] == '-b' ) { branch = args[ 1 ]; args = args.slice( 2 ); }
  if ( args[ 0 ] == '--with-commits' || args[ 0 ] == '-c' ) { with_commits = 1; args = args.slice( 1 ); }
  if ( args[ 0 ] == '--all' || args[ 0 ] == '-a' ) { all = 1; args = args.slice( 1 ); }
  if ( args[ 0 ] == '--branch' || args[ 0 ] == '-b' ) { branch = args[ 1 ]; args = args.slice( 2 ); }
  if ( args[ 0 ] == '--with-commits' || args[ 0 ] == '-c' ) { with_commits = 1; args = args.slice( 1 ); }
  if ( args[ 0 ] == '--all' || args[ 0 ] == '-a' ) { all = 1; args = args.slice( 1 ); }

  // We used to actually get the version here.
  // The reason we CAN'T is that there may be newer REMOTE version tags that we haven't pulled at this time.
  // We need to determine the actual next version LATER in git-sync.

  const comment = combine_params( args );

  return {
    "major": major,
    "minor": minor,
    "pull_only": pull_only,
    "comment": comment,
    "branch": branch,
    "with_commits": with_commits,
    "all": all,
  };
}


// =========== npm_update_version ============
export const npm_update_version = version => {
  const filename = 'package.json';
  try {
    // We know we have an npm package.
    // Ensure the version increment exceeds the last published npm package version.
    const adjustedVersion = get_npm_adjusted_version( version );

    console.log( 'Stamping version [' + adjustedVersion + '] into [' + filename + ']...' );
    const origversion = readFileSync( filename, 'utf-8' );
    //   "version": "1.3.0",  ==>    "version": "###version###",
    const newversion = origversion.replace( /\"version\".*/, '\"version\": \"' + adjustedVersion + '\",' );
    writeFileSync( filename, newversion, 'utf-8' );
    // console.log(filename + " was updated...");

    // ALWAYS update dependencies.
    // This is an opinionated choice, it will break you faster, but get you fixed faster as well.
    // It is also used here to update our new version in the package-lock.json file.
    console.log( 'Updating ALL dependencies...' );
    run_command_sync_to_console( "npm update" );

    return adjustedVersion;
  }
  catch ( err ) {
    console.log( filename + ' could not be updated: ' + err );
    process.exit( 1 );
  }
}


// =========== svn_last_changed_rev: gets the SVN "last changed rev" for the current folder, as a string ============
export const svn_last_changed_rev = () => {

  const svn_info = run_command_sync( "svn info" );

  // extract the "Last Changed Rev"
  const regx = /^Last Changed Rev: (.*)$/gm;
  const array_result = regx.exec( svn_info );

  // return the first group result ([0] contains the whole result)
  return array_result[ 1 ];
}


// =========== svn_rev: gets the SVN current revision for the current repo, as a string ============
export const svn_rev = () => {

  const svn_info = run_command_sync( "svn info" );

  // extract the "Last Changed Rev"
  const regx = /^Revision: (.*)$/gm;
  const array_result = regx.exec( svn_info );

  // return the first group result ([0] contains the whole result)
  return array_result[ 1 ];
}


// ============ build_semantic_version: builds "next" historical semver, with validation using stored result ===============
export const build_semantic_version = ( major, minor, patch, build, lastVersionFolder ) => {

  process.chdir( lastVersionFolder );

  let m = parseInt( readFileSync( 'major.txt', 'utf-8' ) );
  let n = parseInt( readFileSync( 'minor.txt', 'utf-8' ) );
  let p = parseInt( readFileSync( 'patch.txt', 'utf-8' ) );
  let b = parseInt( readFileSync( 'build.txt', 'utf-8' ) );

  // Compare to parameters
  // If different, adjust and save
  let m2 = major;
  let n2 = minor;
  let p2 = patch;
  let b2 = build;

  if ( m2 != m ) {
    // Validate
    if (
      m2 != m + 1
            || n2 != 0
            || p2 != 0
    ) {
      console.log( 'New major version provided incorrectly: old(' + m + '.' + n + '.' + p + '.' + b + ") new(" + m2 + '.' + n2 + '.' + p2 + '.' + b2 + ')' );
      process.exit( 1 );
    }

    // Reset n p
    m = m2;
    n = 0;
    p = 0;
    writeFileSync( 'major.txt', m, 'utf-8' );
    writeFileSync( 'minor.txt', n, 'utf-8' );
    writeFileSync( 'patch.txt', p, 'utf-8' );

  } else if ( n2 != n ) {

    // Validate
    if (
      n2 != n + 1
            || p2 != 0
    ) {
      console.log( 'New minor version provided incorrectly: old(' + m + '.' + n + '.' + p + '.' + b + ") new(" + m2 + '.' + n2 + '.' + p2 + '.' + b2 + ')' );
      process.exit( 1 );
    }

    // Reset p
    n = n2;
    p = 0;
    writeFileSync( 'minor.txt', n, 'utf-8' );
    writeFileSync( 'patch.txt', p, 'utf-8' );

  } else if ( p2 != p ) {

    // Validate
    if ( p2 != p + 1 ) {
      console.log( 'New patch version provided incorrectly: old(' + m + '.' + n + '.' + p + '.' + b + ") new(" + m2 + '.' + n2 + '.' + p2 + '.' + b + ')' );
      process.exit( 1 );
    }

    p = p2;
    writeFileSync( 'patch.txt', p, 'utf-8' );

  }

  // Write the new build version.
  b = b2;
  writeFileSync( 'build.txt', b, 'utf-8' );

  return m + '.' + n + '.' + p + '.' + b;
}
