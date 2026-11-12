export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('applications').del();
  await knex('opportunities').del();
  await knex('users').del();

  // Inserts seed entries
  await knex('users').insert([
    {
      id: 1,
      email: 'admin@admin.com',
      verified_email: 1,
      password: '$2a$12$ILiNrGYbDMWuxq8TVddp0OTL4bVKVJXbQqySjAmEbNLot8rPsGWr6', // Senha123! hashed with bcryptjs 12 rounds
      user_type: 'ADMIN',
      status: 'ATIVO',
      full_name: 'Administrador do Sistema',
      bio: 'Administrador do sistema Zircon.',
      phone_number: '(11)99999-9999',
      document_type: 'CPF',
      document_number: '12345678900',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      deleted_at: null,
    },
  ]);
}