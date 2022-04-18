#!/usr/bin/env node

import { parse_tag_parameters, git_tag_list } from './version-control.js';

var tag_params = parse_tag_parameters(process.argv);
git_tag_list(tag_params);
