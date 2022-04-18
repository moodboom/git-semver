#!/usr/bin/env node

import { svn_last_changed_rev } from './version-control.js';
console.log(svn_last_changed_rev());
