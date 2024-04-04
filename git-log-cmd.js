#!/usr/bin/env node

import { parse_tag_parameters, git_log } from './version-control.js';

var tag_params = parse_tag_parameters( process.argv );
git_log( tag_params );
