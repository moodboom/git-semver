#!/usr/bin/env node

import { npm_update_version } from './version-control.js';

var args = process.argv.slice( 2 );
var version = args[ 0 ];
npm_update_version( version );
