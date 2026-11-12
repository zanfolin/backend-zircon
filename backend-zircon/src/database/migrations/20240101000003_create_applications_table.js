export async function up(knex) {
  await knex.schema.createTable('applications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('vacancy_id').notNullable();
    table.enu('status', ['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']).notNullable().defaultTo('PENDENTE');
    table.string('expiration_date', 30).nullable();
    table.string('created_at', 30).notNullable();
    table.string('updated_at', 30).notNullable();
    table.string('deleted_at', 30).nullable();

    table.index('user_id', 'idx_application_user_id');
    table.index('vacancy_id', 'idx_application_vacancy_id');
    table.unique(['user_id', 'vacancy_id'], 'uq_application_user_vacancy');
    table.index('status', 'idx_application_status');
    table.index('expiration_date', 'idx_application_expiration_date');
    table.index('created_at', 'idx_application_created_at');
    table.index('deleted_at', 'idx_application_deleted_at');

    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    table.foreign('vacancy_id')
      .references('id')
      .inTable('opportunities')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });

  // Trigger para atualizar updated_at automaticamente
  await knex.raw(`
    CREATE TRIGGER trg_applications_updated_at
    AFTER UPDATE ON applications
    FOR EACH ROW
    BEGIN
      UPDATE applications SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_applications_updated_at');
  await knex.schema.dropTableIfExists('applications');
}