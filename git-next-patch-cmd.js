#!/usr/bin/env node

import { git_next_patch } from './version-control.js';
console.log( git_next_patch() );
