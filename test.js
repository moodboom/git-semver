#!/usr/bin/env node

// Simple test suite for @moodboom/git-semver — no test framework needed.

import { strict as assert } from 'node:assert';

import {
  git_version_valid,
  next_major,
  next_minor,
  next_patch,
  next_build,
  get_npm_adjusted_version,
  git_version,
  git_version_clean,
  git_folder_from_url,
  parse_tag_parameters,
} from './index.js';

let passed = 0;
let failed = 0;

function test( name, fn ) {
  try {
    fn();
    passed++;
    console.log( `  [OK] ${name}` );
  } catch ( e ) {
    failed++;
    console.log( `  [FAIL] ${name}: ${e.message}` );
  }
}

console.log( '\ngit-semver tests\n' );

// ---- git_version_valid ----

test( 'valid version "1.2.3"', () => {
  assert.equal( git_version_valid( '1.2.3' ), true );
});

test( 'valid version "0.0.0"', () => {
  assert.equal( git_version_valid( '0.0.0' ), true );
});

test( 'valid version with suffix "1.2.3-4-gabcdef"', () => {
  assert.equal( git_version_valid( '1.2.3-4-gabcdef' ), true );
});

test( 'invalid version null', () => {
  assert.equal( git_version_valid( null ), false );
});

test( 'invalid version "abc"', () => {
  assert.equal( git_version_valid( 'abc' ), false );
});

test( 'invalid version "v1.2.3" (leading v)', () => {
  assert.equal( git_version_valid( 'v1.2.3' ), false );
});

// ---- next_major ----

test( 'next_major "1.2.3" => "2.0.0"', () => {
  assert.equal( next_major( '1.2.3' ), '2.0.0' );
});

test( 'next_major "0.0.0" => "1.0.0"', () => {
  assert.equal( next_major( '0.0.0' ), '1.0.0' );
});

test( 'next_major "9.5.2-3-gabcdef" => "10.0.0"', () => {
  assert.equal( next_major( '9.5.2-3-gabcdef' ), '10.0.0' );
});

// ---- next_minor ----

test( 'next_minor "1.2.3" => "1.3.0"', () => {
  assert.equal( next_minor( '1.2.3' ), '1.3.0' );
});

test( 'next_minor "0.0.0" => "0.1.0"', () => {
  assert.equal( next_minor( '0.0.0' ), '0.1.0' );
});

// ---- next_patch ----

test( 'next_patch "1.2.3" => "1.2.4"', () => {
  assert.equal( next_patch( '1.2.3' ), '1.2.4' );
});

test( 'next_patch "0.0.0" => "0.0.1"', () => {
  assert.equal( next_patch( '0.0.0' ), '0.0.1' );
});

test( 'next_patch "5.0.8-2-gabcdef" => "5.0.9"', () => {
  assert.equal( next_patch( '5.0.8-2-gabcdef' ), '5.0.9' );
});

// ---- next_build ----

test( 'next_build "1.2.3" (on tag) => "1.2.3-1"', () => {
  assert.equal( next_build( '1.2.3' ), '1.2.3-1' );
});

test( 'next_build "1.2.3-4-gabcdef" => "1.2.3-5"', () => {
  assert.equal( next_build( '1.2.3-4-gabcdef' ), '1.2.3-5' );
});

// ---- git_folder_from_url ----

test( 'folder from ssh url', () => {
  assert.equal( git_folder_from_url( 'ssh://user@me.com:1000/subdirs/myproject.git' ), 'myproject' );
});

test( 'folder from https url', () => {
  assert.equal( git_folder_from_url( 'https://github.com/user/repo.git' ), 'repo' );
});

test( 'folder from url without .git', () => {
  assert.equal( git_folder_from_url( 'https://github.com/user/myrepo' ), 'myrepo' );
});

// ---- parse_tag_parameters ----

test( 'parse --major flag', () => {
  const p = parse_tag_parameters( [ '--major', 'my', 'message' ], 1 );
  assert.equal( p.major, 1 );
  assert.equal( p.minor, 0 );
  assert.equal( p.comment, 'my message' );
});

test( 'parse --minor flag', () => {
  const p = parse_tag_parameters( [ '--minor', 'fix' ], 1 );
  assert.equal( p.minor, 1 );
  assert.equal( p.major, 0 );
  assert.equal( p.comment, 'fix' );
});

test( 'parse --pull-only flag', () => {
  const p = parse_tag_parameters( [ '--pull-only' ], 1 );
  assert.equal( p.pull_only, 1 );
});

test( 'parse plain message (patch)', () => {
  const p = parse_tag_parameters( [ 'simple', 'commit' ], 1 );
  assert.equal( p.major, 0 );
  assert.equal( p.minor, 0 );
  assert.equal( p.comment, 'simple commit' );
});

test( 'parse --branch flag', () => {
  const p = parse_tag_parameters( [ '--branch', 'develop', 'msg' ], 1 );
  assert.equal( p.branch, 'develop' );
  assert.equal( p.comment, 'msg' );
});

// ---- git_version (live, requires git repo) ----

test( 'git_version returns a string', () => {
  const v = git_version();
  assert.equal( typeof v, 'string' );
  assert.ok( v.length > 0 );
});

test( 'git_version_clean returns MAJOR.MINOR.PATCH', () => {
  const v = git_version_clean();
  assert.ok( /^[0-9]+\.[0-9]+\.[0-9]+$/.test( v ), `got "${v}"` );
});

// ---- get_npm_adjusted_version ----

test( 'get_npm_adjusted_version bumps when version is lower', () => {
  // Current package.json is 5.0.8, so 1.0.0 should get bumped
  const adjusted = get_npm_adjusted_version( '1.0.0' );
  assert.ok( adjusted !== '1.0.0', `expected bump, got "${adjusted}"` );
});

test( 'get_npm_adjusted_version passes through when version is higher', () => {
  const adjusted = get_npm_adjusted_version( '99.0.0' );
  assert.equal( adjusted, '99.0.0' );
});

// ---- regex safety: dots must be literal ----

test( 'next_patch does not match non-dot separators', () => {
  // "1a2b3" should not parse as version 1.2.3
  // With escaped dots, the regex won't match, tokens will be null
  // next_patch will return unknown_version
  const result = next_patch( '1a2b3' );
  assert.equal( result, 'unknown version' );
});

// ---- summary ----

console.log( `\n${passed} passed, ${failed} failed\n` );
if ( failed > 0 ) process.exit( 1 );
