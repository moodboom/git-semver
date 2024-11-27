#!/usr/bin/env node

import { get_npm_adjusted_version } from './version-control.js';

var args = process.argv.slice( 2 );
var version = args[ 0 ];
console.log( get_npm_adjusted_version( version ) );
