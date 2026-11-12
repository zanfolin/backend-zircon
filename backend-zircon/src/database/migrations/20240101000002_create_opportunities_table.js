export async function up(knex) {
  await knex.schema.createTable('opportunities', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('company_sector', 100).nullable();
    table.string('job_title', 255).notNullable();
    table.text('job_description').nullable();
    table.decimal('payment_value', 10, 2).nullable();
    table.text('benefits_text').nullable();
    table.enu('work_modality', ['HOME_OFFICE', 'HIBRIDO', 'PRESENCIAL']).notNullable().defaultTo('HOME_OFFICE');
    table.enu('status', ['ATIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']).notNullable().defaultTo('ATIVA');
    table.string('created_at', 30).notNullable();
    table.string('updated_at', 30).notNullable();
    table.string('deleted_at', 30).nullable();

    table.index('user_id', 'idx_opportunity_user_id');
    table.index('job_title', 'idx_opportunity_job_title');
    table.index('company_sector', 'idx_opportunity_company_sector');
    table.index('payment_value', 'idx_opportunity_payment_value');
    table.index('work_modality', 'idx_opportunity_work_modality');
    table.index('status', 'idx_opportunity_status');
    table.index('created_at', 'idx_opportunity_created_at');
    table.index('deleted_at', 'idx_opportunity_deleted_at');

    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
  });

  // Trigger para atualizar updated_at automaticamente
  await knex.raw(`
    CREATE TRIGGER trg_opportunities_updated_at
    AFTER UPDATE ON opportunities
    FOR EACH ROW
    BEGIN
      UPDATE opportunities SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_opportunities_updated_at');
  await knex.schema.dropTableIfExists('opportunities');
}