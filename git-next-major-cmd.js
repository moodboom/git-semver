#!/usr/bin/env node

import { git_next_major } from './version-control.js';
console.log( git_next_major() );
