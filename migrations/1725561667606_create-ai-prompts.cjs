/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('prompts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    role: { type: 'text', notNull: true },
    content: { type: 'text', notNull: true },
    userId: { type: 'string', notNull: true },
    userProfileName: { type: 'string', notNull: false },
    session: { type: 'text', notNull: false },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('prompts');
  
  pgm.dropExtension('uuid-ossp', { ifExists: true });
};
