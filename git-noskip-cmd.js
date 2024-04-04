#!/usr/bin/env node

import { git_noskip } from './version-control.js';

// 0 = node, 1 = script path, so we ignore those.
// 2 = target file
var target = process.argv[ 2 ];
git_noskip( target );
