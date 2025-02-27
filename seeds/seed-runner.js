#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pgp from 'pg-promise';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection string from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Initialize pg-promise connection
const db = pgp()(DATABASE_URL);

async function runSeed(seedFile) {
  try {
    const seedPath = path.join(__dirname, seedFile);
    console.log(`Running seed: ${seedFile}`);
    
    // Import the seed file (which should be an ES module)
    const seedModule = await import(seedPath);
    
    // Run the seed function
    await seedModule.default(db);
    
    console.log(`✅ Seed ${seedFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error running seed ${seedFile}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Get all seed files (excluding this runner)
    const seedFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.js') && file !== 'seed-runner.js');
    
    // Sort seed files to ensure consistent order
    seedFiles.sort();
    
    console.log(`Found ${seedFiles.length} seed files to run`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Run each seed file
    for (const seedFile of seedFiles) {
      const success = await runSeed(seedFile);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`\nSeed summary: ${successCount} succeeded, ${failCount} failed`);
    
    // Close database connection
    await db.$pool.end();
    
    // Exit with error code if any seeds failed
    if (failCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

main();
