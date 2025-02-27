#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get seed name from command line arguments
const seedName = process.argv[2];

if (!seedName) {
  console.error('Please provide a seed name: node scripts/create-seed.js my_seed_name');
  process.exit(1);
}

// Format seed name to snake_case
const formattedName = seedName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

// Get the seeds directory
const seedsDir = path.join(__dirname, '..', 'seeds');

// Get existing seed files to determine the next number
const existingSeeds = fs.readdirSync(seedsDir)
  .filter(file => file.match(/^\d+_.*\.js$/))
  .sort();

// Determine the next seed number
let nextNumber = 1;
if (existingSeeds.length > 0) {
  const lastSeed = existingSeeds[existingSeeds.length - 1];
  const lastNumber = parseInt(lastSeed.split('_')[0], 10);
  nextNumber = lastNumber + 1;
}

// Format the number with leading zeros
const paddedNumber = nextNumber.toString().padStart(2, '0');

// Create the seed file name
const seedFileName = `${paddedNumber}_${formattedName}.js`;
const seedFilePath = path.join(seedsDir, seedFileName);

// Seed file template
const seedTemplate = `/**
 * Seed file for ${formattedName.replace(/_/g, ' ')}
 * 
 * @param {import('pg-promise').IDatabase<{}>} db - Database connection
 * @returns {Promise<void>}
 */
export default async function(db) {
  // Check if target table exists
  const tableExists = await db.oneOrNone(\`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'your_table_name'
    );
  \`);
  
  if (!tableExists || !tableExists.exists) {
    console.log('Target table does not exist yet. Skipping seed.');
    return;
  }
  
  // Data to seed
  const data = [
    // Add your seed data here
  ];
  
  console.log('Seeding data...');
  
  // Use a transaction to ensure all operations succeed or fail together
  return db.tx('seed-${formattedName}', async (t) => {
    // Implement your seed logic here
    
    // Example:
    // for (const item of data) {
    //   // Check if item already exists
    //   const exists = await t.oneOrNone(
    //     'SELECT * FROM your_table_name WHERE id = $1',
    //     [item.id]
    //   );
    //   
    //   if (exists) {
    //     console.log(\`Item \${item.id} already exists, skipping.\`);
    //   } else {
    //     // Insert new item
    //     await t.none(
    //       'INSERT INTO your_table_name(column1, column2) VALUES($1, $2)',
    //       [item.column1, item.column2]
    //     );
    //     console.log(\`Added item: \${item.id}\`);
    //   }
    // }
  });
}`;

// Write the seed file
fs.writeFileSync(seedFilePath, seedTemplate);

console.log(`Created new seed file: ${seedFilePath}`);

// Update package.json to add a script for creating seeds
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts['create:seed']) {
    packageJson.scripts['create:seed'] = 'node scripts/create-seed.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('Added "create:seed" script to package.json');
  }
} catch (error) {
  console.error('Error updating package.json:', error);
}
