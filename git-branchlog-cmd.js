#!/usr/bin/env node

import { parse_tag_parameters, git_branchlog } from './version-control.js';

var tag_params = parse_tag_parameters( process.argv );
git_branchlog( tag_params );
