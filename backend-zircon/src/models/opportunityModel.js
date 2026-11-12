import db from '../config/database.js';

const OPPORTUNITY_SELECT_FIELDS = [
  'id',
  'user_id',
  'company_sector',
  'job_title',
  'job_description',
  'payment_value',
  'benefits_text',
  'work_modality',
  'status',
  'created_at',
  'updated_at',
];

export const opportunityModel = {
  async findAll(filters = {}) {
    let query = db('opportunities')
      .select(OPPORTUNITY_SELECT_FIELDS)
      .whereNull('deleted_at');

    if (filters.user_id) {
      query = query.where('user_id', filters.user_id);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.work_modality) {
      query = query.where('work_modality', filters.work_modality);
    }
    if (filters.company_sector) {
      query = query.where('company_sector', filters.company_sector);
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('job_title', 'like', `%${filters.search}%`)
          .orWhere('job_description', 'like', `%${filters.search}%`)
          .orWhere('company_sector', 'like', `%${filters.search}%`);
      });
    }

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);
    }

    return query.orderBy('created_at', 'desc');
  },

  async findById(id) {
    return db('opportunities')
      .select(OPPORTUNITY_SELECT_FIELDS)
      .where({ id })
      .whereNull('deleted_at')
      .first();
  },

  async findByIdWithCompany(id) {
    return db('opportunities as o')
      .select([
        ...OPPORTUNITY_SELECT_FIELDS.map(f => `o.${f}`),
        'u.full_name as company_name',
        'u.email as company_email',
        'u.phone_number as company_phone',
      ])
      .leftJoin('users as u', 'o.user_id', 'u.id')
      .where({ 'o.id': id })
      .whereNull('o.deleted_at')
      .first();
  },

  async create(opportunityData) {
    const [id] = await db('opportunities').insert(opportunityData);
    return this.findById(id);
  },

  async update(id, opportunityData) {
    await db('opportunities').where({ id }).update(opportunityData);
    return this.findById(id);
  },

  async softDelete(id) {
    await db('opportunities')
      .where({ id })
      .update({ deleted_at: new Date().toISOString() });
  },

  async count(filters = {}) {
    let query = db('opportunities').whereNull('deleted_at');

    if (filters.user_id) {
      query = query.where('user_id', filters.user_id);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.work_modality) {
      query = query.where('work_modality', filters.work_modality);
    }
    if (filters.company_sector) {
      query = query.where('company_sector', filters.company_sector);
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('job_title', 'like', `%${filters.search}%`)
          .orWhere('job_description', 'like', `%${filters.search}%`)
          .orWhere('company_sector', 'like', `%${filters.search}%`);
      });
    }

    const result = await query.count('* as count').first();
    return parseInt(result.count, 10);
  },

  async getSectors() {
    return db('opportunities')
      .select('company_sector')
      .whereNull('deleted_at')
      .whereNotNull('company_sector')
      .distinct()
      .orderBy('company_sector');
  },
};