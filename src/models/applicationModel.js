import db from '../config/database.js';

const APPLICATION_SELECT_FIELDS = [
  'id',
  'user_id',
  'vacancy_id',
  'status',
  'expiration_date',
  'created_at',
  'updated_at',
];

export const applicationModel = {
  async findAll(filters = {}) {
    let query = db('applications')
      .select(APPLICATION_SELECT_FIELDS)
      .whereNull('deleted_at');

    if (filters.user_id) {
      query = query.where('user_id', filters.user_id);
    }
    if (filters.vacancy_id) {
      query = query.where('vacancy_id', filters.vacancy_id);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);
    }

    return query.orderBy('created_at', 'desc');
  },

  async findById(id) {
    return db('applications')
      .select(APPLICATION_SELECT_FIELDS)
      .where({ id })
      .whereNull('deleted_at')
      .first();
  },

  async findByIdWithDetails(id) {
    return db('applications as a')
      .select([
        ...APPLICATION_SELECT_FIELDS.map(f => `a.${f}`),
        'u.full_name as professional_name',
        'u.email as professional_email',
        'u.phone_number as professional_phone',
        'u.avatar_url as professional_avatar',
        'u.bio as professional_bio',
        'o.job_title',
        'o.company_sector',
        'o.work_modality',
        'o.payment_value',
        'ou.id as opportunity_user_id',
        'ou.full_name as company_name',
        'ou.email as company_email',
      ])
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .leftJoin('opportunities as o', 'a.vacancy_id', 'o.id')
      .leftJoin('users as ou', 'o.user_id', 'ou.id')
      .where({ 'a.id': id })
      .whereNull('a.deleted_at')
      .first();
  },

  async findByUserAndVacancy(userId, vacancyId) {
    return db('applications')
      .select(APPLICATION_SELECT_FIELDS)
      .where({ user_id: userId, vacancy_id: vacancyId })
      .whereNull('deleted_at')
      .first();
  },

  async create(applicationData) {
    const [id] = await db('applications').insert(applicationData);
    return this.findById(id);
  },

  async update(id, applicationData) {
    await db('applications').where({ id }).update(applicationData);
    return this.findById(id);
  },

  async softDelete(id) {
    await db('applications')
      .where({ id })
      .update({ deleted_at: new Date().toISOString() });
  },

  async count(filters = {}) {
    let query = db('applications').whereNull('deleted_at');

    if (filters.user_id) {
      query = query.where('user_id', filters.user_id);
    }
    if (filters.vacancy_id) {
      query = query.where('vacancy_id', filters.vacancy_id);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }

    const result = await query.count('* as count').first();
    return parseInt(result.count, 10);
  },

  async getByVacancyWithProfessional(vacancyId) {
    return db('applications as a')
      .select([
        ...APPLICATION_SELECT_FIELDS.map(f => `a.${f}`),
        'u.full_name as professional_name',
        'u.email as professional_email',
        'u.phone_number as professional_phone',
        'u.avatar_url as professional_avatar',
        'u.bio as professional_bio',
      ])
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .where({ 'a.vacancy_id': vacancyId })
      .whereNull('a.deleted_at')
      .orderBy('a.created_at', 'desc');
  },
};