#!/usr/bin/env node

import fs from 'fs';
import { Command } from 'commander';
import { transform } from '../src/core.js';

const program = new Command();

program
  .name('golfy')
  .description('A tool for JavaScript code golf')
  .version('0.1.0');

program
  .argument('[file]', 'input file')
  .action(async (file) => {
    // If file not privided, read from stdin
    const data = await new Promise((resolve, reject) => {
      if (!file) {
        process.stdin.setEncoding('utf8');
        let input = '';
        process.stdin.on('data', (chunk) => {
          input += chunk;
        });
        process.stdin.on('end', async () => {
          resolve(input);
        });
        process.stdin.on('error', (err) => {
          console.error(`Error reading stdin: ${err}`);
          reject(err);
        });
      } else {
        fs.readFile(file, 'utf8', async (err, data) => {
          if (err) {
            console.error(`Error reading file: ${err}`);
            reject(err);
          }
          resolve(data);
        });
      }
    });
    const result = await transform(data);
    process.stdout.write(result.code);
    process.exit(0);
  });

program.parse(process.argv);
