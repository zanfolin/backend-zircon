import db from '../config/database.js';

const USER_SELECT_FIELDS = [
  'id',
  'email',
  'verified_email',
  'user_type',
  'status',
  'full_name',
  'avatar_url',
  'bio',
  'phone_number',
  'document_type',
  'document_number',
  'created_at',
  'updated_at',
];

export const userModel = {
  async findAll(filters = {}) {
    let query = db('users')
      .select(USER_SELECT_FIELDS)
      .whereNull('deleted_at');

    if (filters.user_type) {
      query = query.where('user_type', filters.user_type);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('full_name', 'like', `%${filters.search}%`)
          .orWhere('email', 'like', `%${filters.search}%`)
          .orWhere('document_number', 'like', `%${filters.search}%`);
      });
    }

    return query.orderBy('created_at', 'desc');
  },

  async findById(id) {
    return db('users')
      .select(USER_SELECT_FIELDS)
      .where({ id })
      .whereNull('deleted_at')
      .first();
  },

  async findByIdWithPassword(id) {
    return db('users')
      .select('*')
      .where({ id })
      .whereNull('deleted_at')
      .first();
  },

  async findByEmail(email) {
    return db('users')
      .select('*')
      .where({ email })
      .whereNull('deleted_at')
      .first();
  },

  async findByDocument(documentNumber) {
    return db('users')
      .select('*')
      .where({ document_number: documentNumber })
      .whereNull('deleted_at')
      .first();
  },

  async findByVerificationCode(code) {
    return db('users')
      .select('*')
      .where({ code_email_verification: code })
      .whereNull('deleted_at')
      .first();
  },

  async findByPasswordResetToken(token) {
    // We'll store reset token in code_email_verification field temporarily
    return db('users')
      .select('*')
      .where({ code_email_verification: token })
      .whereNull('deleted_at')
      .first();
  },

  async create(userData) {
    const [id] = await db('users').insert(userData);
    return this.findById(id);
  },

  async update(id, userData) {
    await db('users').where({ id }).update(userData);
    return this.findById(id);
  },

  async softDelete(id) {
    await db('users')
      .where({ id })
      .update({ deleted_at: new Date().toISOString() });
  },

  async verifyEmail(id) {
    await db('users')
      .where({ id })
      .update({
        verified_email: 1,
        code_email_verification: null,
      });
    return this.findById(id);
  },

  async updateVerificationCode(id, code) {
    await db('users')
      .where({ id })
      .update({ code_email_verification: code });
  },

  async updatePassword(id, hashedPassword) {
    await db('users')
      .where({ id })
      .update({ password: hashedPassword });
  },

  async updateAvatar(id, avatarUrl) {
    await db('users')
      .where({ id })
      .update({ avatar_url: avatarUrl });
    return this.findById(id);
  },

  async count(filters = {}) {
    let query = db('users').whereNull('deleted_at');

    if (filters.user_type) {
      query = query.where('user_type', filters.user_type);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }

    const result = await query.count('* as count').first();
    return parseInt(result.count, 10);
  },
};