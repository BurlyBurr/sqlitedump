#!/usr/bin/env bun

/************************************************
 * IMPORTS
 ***********************************************/

import { parseArgs } from 'util';

/************************************************
 * CONSTANTS
 ***********************************************/

const APOS = "'";
const SYSTEM_TABLES = [
  'sqlite_sequence',
  // TODO: Add all possible system tables
];
const SPONSOR_MESSAGE = [
  '------------------------------------------------------------------------------',
  '-- sqlitedump is brought to you by Burly Burr Knife Sharpening in Seattle, WA',
  '-- Check out the upcoming appearances on burlyburr.com',
  '------------------------------------------------------------------------------',
];
const MISSING_BUN_RUNTIME = '⚠️  This library depends on the SQLite support of the bun standard library.';

/************************************************
 * FUNCTIONS
 ***********************************************/

function ansiRed(str) {
  return '\x1b[31m' + str + '\x1b[0m';
}

function printUsageAndExit() {
  console.log(`${ansiRed('Usage:')} bunx sqlitedump mydatabase.sqlite [options]`);
  console.log('');
  console.log('Options:');
  console.log('--exclude-table      comma-delimited list of table names to exclude');
  console.log('--help               show this info');
  process.exit();
}

function sqlEscape(value, type) {
  if (typeof value == 'string') {
    return `'${value.replaceAll(APOS, APOS.repeat(2))}'`;
  }
  if (value === null) {
    return 'NULL';
  }
  return value;
}

/************************************************
 * TOP LEVEL CODE
 ***********************************************/

let Database;
try {
  let bunSqlite = await import('bun:sqlite');
  Database = bunSqlite.default;;
} catch (e) {
  console.error(MISSING_BUN_RUNTIME);
  throw(e);
}

let { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'exclude-table': {
      type: 'string',
      short: 'e',
    },
    'help': {
      type: 'boolean',
      short: 'h',
    },
  },
});

let [ dbFilename ] = positionals;
let excludedTableNames = [];
if (values['exclude-table']) {
  excludedTableNames = values['exclude-table'].split(',');
}

if (values.help) {
  printUsageAndExit();
}

if (!dbFilename) {
  printUsageAndExit();
}

let db = new Database(dbFilename, { readonly: true });

// Get all non-system table names
let query = db.query('SELECT name FROM sqlite_master WHERE type="table";');
let tableNames = query.all()
    .map(x => x.name)
    .filter(x => !SYSTEM_TABLES.includes(x))
    .filter(x => !excludedTableNames.includes(x));

let statements = [
  ...SPONSOR_MESSAGE,
];

tableNames.forEach(tableName => {
  let columns = db.query(`PRAGMA table_info(${tableName})`).all();
  let rows = db.query(`SELECT * FROM ${tableName}`).values();

  rows.forEach(row => {
    let columnNames = [], columnValues = [];
    for (let i = 0; i < columns.length; i++) {
      let { name, type, dflt_value, notnull } = columns[i];
      columnNames.push(name);
      columnValues.push(sqlEscape(row[i], type));
    }
    statements.push(`INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${columnValues.join(', ')});`);
  });
});

let output = statements.join('\n');

console.log(output);
