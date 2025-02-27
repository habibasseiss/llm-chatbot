/**
 * Example seed file for initial settings
 * 
 * @param {import('pg-promise').IDatabase<{}>} db - Database connection
 * @returns {Promise<void>}
 */
export default async function(db) {
  // Check if settings table exists
  const tableExists = await db.oneOrNone(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'settings'
    );
  `);
  
  if (!tableExists || !tableExists.exists) {
    console.log('Settings table does not exist yet. Skipping seed.');
    return;
  }
  
  // Example settings to seed with values as JSON
  const settings = [
    { key: 'system_prompt', value: 'You are a helpful AI assistant.' },
    { key: 'session_duration', value: 24 },
    { key: 'llm_config', value: JSON.stringify({
      model: 'gpt-4',
      temperature: 0.7,
      top_p: 0.2,
      max_tokens: null
    })},
  ];
  
  console.log('Seeding initial settings...');
  
  // Use a transaction to ensure all operations succeed or fail together
  return db.tx('seed-settings', async (t) => {
    for (const setting of settings) {
      // Check if setting already exists
      const exists = await t.oneOrNone(
        'SELECT * FROM settings WHERE key = $1',
        [setting.key]
      );
      
      if (exists) {
        console.log(`Setting ${setting.key} already exists, skipping.`);
      } else {
        // Insert new setting
        await t.none(
          'INSERT INTO settings(key, value) VALUES($1, $2)',
          [setting.key, setting.value]
        );
        console.log(`Added setting: ${setting.key} = ${setting.value}`);
      }
    }
  });
}
