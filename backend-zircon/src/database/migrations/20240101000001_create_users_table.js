export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.integer('verified_email').notNullable().defaultTo(0);
    table.string('code_email_verification', 6).nullable();
    table.string('password', 255).notNullable().defaultTo('Senha123!');
    table.enu('user_type', ['ADMIN', 'EMPRESA', 'PROFISSIONAL']).notNullable().defaultTo('PROFISSIONAL');
    table.enu('status', ['ATIVO', 'INATIVO', 'BLOQUEADO']).notNullable().defaultTo('ATIVO');
    table.string('full_name', 255).nullable();
    table.string('avatar_url', 500).nullable();
    table.text('bio').nullable();
    table.string('phone_number', 20).nullable();
    table.enu('document_type', ['CPF', 'CNPJ', 'Passaporte']).notNullable().defaultTo('CPF');
    table.string('document_number', 20).notNullable();
    table.string('created_at', 30).notNullable();
    table.string('updated_at', 30).notNullable();
    table.string('deleted_at', 30).nullable();

    table.index('email', 'idx_user_email');
    table.index('user_type', 'idx_user_type');
    table.index('status', 'idx_user_status');
    table.index('full_name', 'idx_user_full_name');
    table.index('document_number', 'idx_user_document_number');
    table.index('deleted_at', 'idx_user_deleted_at');
  });

  // Trigger para atualizar updated_at automaticamente
  await knex.raw(`
    CREATE TRIGGER trg_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
      UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_users_updated_at');
  await knex.schema.dropTableIfExists('users');
}