/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).nullable(); // null for OAuth-only users
    table.string('name', 255).defaultTo('');
    table.string('google_id', 255).unique().nullable();
    table.string('preferred_currency', 3).defaultTo('USD');
    table.boolean('notification_email').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Categories table
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.enu('type', ['income', 'expense']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'name', 'type']);
  });

  // Transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('category_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
    table.enu('type', ['income', 'expense']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.text('description').defaultTo('');
    table.date('date').notNullable();
    table.string('receipt_path', 500).nullable();
    table.boolean('is_imported').defaultTo(false);
    table.string('import_hash', 64).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['user_id', 'date']);
    table.index(['user_id', 'type']);
    table.index(['user_id', 'category_id']);
  });

  // Budgets table
  await knex.schema.createTable('budgets', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('CASCADE');
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.enu('period', ['monthly', 'yearly']).defaultTo('monthly');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'category_id', 'period']);
  });

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.boolean('sent_email').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id', 'is_read']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('budgets');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};
