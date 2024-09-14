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
  
  pgm.createTable('prompts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    role: { type: 'text', notNull: true },
    content: { type: 'text', notNull: true },
    session_id: { type: 'uuid', notNull: true },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.addConstraint('prompts', 'fk_session_id', {
    foreignKeys: {
      columns: 'session_id',
      references: 'sessions(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint('prompts', 'fk_session_id');
  pgm.dropTable('prompts');
};
