# Database Seeds

This directory contains seed files for initializing the database with default data.

## How Seeds Work

Seeds are JavaScript files that insert initial data into the database. They work alongside migrations but serve a different purpose:

- **Migrations**: Define the database schema (tables, columns, constraints)
- **Seeds**: Populate the database with initial data

## Seed File Structure

Each seed file should:

1. Be a JavaScript file with an `.js` extension
2. Export a default async function that accepts a database connection
3. Follow the naming convention `XX_description.js` where XX is a number for ordering

Example:
```javascript
/**
 * Seed file description
 * 
 * @param {import('pg-promise').IDatabase<{}>} db - Database connection
 * @returns {Promise<void>}
 */
export default async function(db) {
  // Seed logic here
}
```

## Running Seeds

To run all seed files:

```bash
npm run seed
```

## Best Practices

1. Make seeds idempotent (safe to run multiple times)
2. Check if data already exists before inserting
3. Use transactions when appropriate
4. Keep seed files focused on a specific data set
5. Document the purpose of each seed file

## Integration with node-pg-migrate

Seeds complement migrations but are run separately. The typical workflow is:

1. Run migrations to create/update the database schema: `npm run migrate up`
2. Run seeds to populate initial data: `npm run seed`

For a complete database setup, you can create a script that runs both:

```bash
# Add to package.json scripts
"db:setup": "npm run migrate up && npm run seed"
```
