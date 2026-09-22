import request from 'supertest';
import app from '../src/app.js';
import db from '../src/config/database.js';
import { tokenService } from '../src/services/tokenService.js';
import { passwordService } from '../src/services/passwordService.js';

// Helper to generate unique test data
const generateTestUser = (suffix, userType = 'PROFISSIONAL') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const base = `${timestamp}${random}${suffix}`;
  
  if (userType === 'EMPRESA') {
    return {
      email: `empresa_${base}@test.com`,
      password: 'Senha123!',
      user_type: 'EMPRESA',
      document_type: 'CNPJ',
      document_number: `112223330001${String(suffix).padStart(2, '0')}`,
      full_name: `Empresa ${base}`,
    };
  }
  
  return {
    email: `profissional_${base}@test.com`,
    password: 'Senha123!',
    user_type: 'PROFISSIONAL',
    document_type: 'CPF',
    document_number: `111444777${String(suffix).padStart(2, '0')}`,
    full_name: `Profissional ${base}`,
  };
};

const generateValidCPF = () => {
  // Generate a valid CPF for testing
  const base = Math.floor(Math.random() * 900000000) + 100000000;
  return base.toString().padStart(9, '0') + '35'; // Simplified - not actually valid but unique
};

const generateValidCNPJ = () => {
  const base = Math.floor(Math.random() * 900000000000) + 100000000000;
  return base.toString().padStart(12, '0') + '81'; // Simplified - not actually valid but unique
};

describe('Zircon API Integration Tests', () => {
  let adminToken;
  let empresaToken;
  let profissionalToken;
  let opportunityId;
  let applicationId;
  let testEmpresaData;
  let testProfissionalData;

  beforeAll(async () => {
    // Run migrations and seeds
    await db.migrate.latest();
    await db.seed.run();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: 'Senha123!' });
    adminToken = adminLogin.body.data.accessToken;

    // Create and verify empresa user
    testEmpresaData = generateTestUser('empresa', 'EMPRESA');
    const empresaRegister = await request(app)
      .post('/api/auth/register')
      .send(testEmpresaData);

    // Get verification code from database
    const empresaUser = await db('users').where('email', testEmpresaData.email).select('code_email_verification').first();
    await request(app)
      .post('/api/auth/verify-email')
      .send({ code: empresaUser.code_email_verification });

    const empresaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmpresaData.email, password: testEmpresaData.password });
    empresaToken = empresaLogin.body.data.accessToken;

    // Create and verify profissional user
    testProfissionalData = generateTestUser('profissional', 'PROFISSIONAL');
    const profissionalRegister = await request(app)
      .post('/api/auth/register')
      .send(testProfissionalData);

    const profissionalUser = await db('users').where('email', testProfissionalData.email).select('code_email_verification').first();
    await request(app)
      .post('/api/auth/verify-email')
      .send({ code: profissionalUser.code_email_verification });

    const profissionalLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testProfissionalData.email, password: testProfissionalData.password });
    profissionalToken = profissionalLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Zircon API is running');
    });
  });

  describe('Auth Flow', () => {
    test('POST /api/auth/register should create a new user', async () => {
      const uniqueUser = generateTestUser('register', 'PROFISSIONAL');
      const response = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(uniqueUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('POST /api/auth/register should reject duplicate email', async () => {
      const uniqueUser = generateTestUser('duplicate', 'PROFISSIONAL');
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(uniqueUser);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/register should reject invalid CPF', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalidcpf@test.com',
          password: 'Senha123!',
          user_type: 'PROFISSIONAL',
          document_type: 'CPF',
          document_number: '12345678900',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/login should authenticate valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@admin.com', password: 'Senha123!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('POST /api/auth/login should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@admin.com', password: 'WrongPassword!' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/refresh should generate new access token', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@admin.com', password: 'Senha123!' });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.data.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('GET /api/auth/me should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(1);
      expect(response.body.data.user.email).toBe('admin@admin.com');
    });

    test('GET /api/auth/me should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Management', () => {
    test('GET /api/users/profile should return authenticated user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${profissionalToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('profissional@test.com');
    });

    test('PUT /api/users/profile should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({
          full_name: 'Updated Name',
          bio: 'Updated bio',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe('Updated Name');
    });

    test('PUT /api/users/password should change password', async () => {
      // Create a fresh user for this test to avoid password conflicts
      const freshUser = generateTestUser('password', 'PROFISSIONAL');
      const register = await request(app)
        .post('/api/auth/register')
        .send(freshUser);
      
      const freshUserDb = await db('users').where('email', freshUser.email).select('code_email_verification').first();
      await request(app)
        .post('/api/auth/verify-email')
        .send({ code: freshUserDb.code_email_verification });
      
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: freshUser.email, password: freshUser.password });
      const freshToken = login.body.data.accessToken;

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          currentPassword: freshUser.password,
          newPassword: 'NovaSenha123!',
          confirmPassword: 'NovaSenha123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Admin GET /api/users should list all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('Non-admin GET /api/users should be forbidden', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${profissionalToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Opportunity Management', () => {
    test('POST /api/opportunities should create opportunity (EMPRESA)', async () => {
      const response = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${empresaToken}`)
        .send({
          job_title: 'Desenvolvedor Front-end',
          job_description: 'Vaga para desenvolvedor React',
          company_sector: 'Tecnologia',
          payment_value: 7000,
          benefits_text: 'Vale refeição, home office',
          work_modality: 'HOME_OFFICE',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.opportunity.job_title).toBe('Desenvolvedor Front-end');
      opportunityId = response.body.data.opportunity.id;
    });

    test('POST /api/opportunities should be forbidden for PROFISSIONAL', async () => {
      const response = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({
          job_title: 'Test',
          job_description: 'Test',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/opportunities should list active opportunities', async () => {
      const response = await request(app)
        .get('/api/opportunities');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.opportunities)).toBe(true);
    });

    test('GET /api/opportunities/:id should return opportunity details', async () => {
      const response = await request(app)
        .get(`/api/opportunities/${opportunityId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.opportunity.id).toBe(opportunityId);
    });

    test('PUT /api/opportunities/:id should update opportunity (owner)', async () => {
      const response = await request(app)
        .put(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${empresaToken}`)
        .send({
          job_title: 'Desenvolvedor Full-stack',
          payment_value: 8000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.opportunity.job_title).toBe('Desenvolvedor Full-stack');
    });

    test('PUT /api/opportunities/:id should be forbidden for non-owner', async () => {
      const response = await request(app)
        .put(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({
          job_title: 'Hacked Title',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('Admin GET /api/opportunities/admin/all should list all opportunities', async () => {
      const response = await request(app)
        .get('/api/opportunities/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.opportunities)).toBe(true);
    });
  });

  describe('Application Management', () => {
    test('POST /api/applications should create application (PROFISSIONAL)', async () => {
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({ vacancy_id: opportunityId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.application.vacancy_id).toBe(opportunityId);
      applicationId = response.body.data.application.id;
    });

    test('POST /api/applications should reject duplicate application', async () => {
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({ vacancy_id: opportunityId });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/applications/my should list user applications', async () => {
      const response = await request(app)
        .get('/api/applications/my')
        .set('Authorization', `Bearer ${profissionalToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.applications)).toBe(true);
    });

    test('GET /api/applications/opportunity/:id should list applications for opportunity (EMPRESA)', async () => {
      const response = await request(app)
        .get(`/api/applications/opportunity/${opportunityId}`)
        .set('Authorization', `Bearer ${empresaToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.applications)).toBe(true);
    });

    test('PUT /api/applications/:id/status should update status (EMPRESA)', async () => {
      const response = await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${empresaToken}`)
        .send({ status: 'EM_ANALISE' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.application.status).toBe('EM_ANALISE');
    });

    test('PUT /api/applications/:id/status should allow PENDENTE -> APROVADA', async () => {
      // Create another application to test direct approval
      const newApp = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({ vacancy_id: opportunityId });

      const newAppId = newApp.body.data.application.id;

      const response = await request(app)
        .put(`/api/applications/${newAppId}/status`)
        .set('Authorization', `Bearer ${empresaToken}`)
        .send({ status: 'APROVADA' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.application.status).toBe('APROVADA');
    });

    test('DELETE /api/applications/:id should cancel application (owner)', async () => {
      // Create another application to cancel
      const newApp = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({ vacancy_id: opportunityId });

      const newAppId = newApp.body.data.application.id;

      const response = await request(app)
        .delete(`/api/applications/${newAppId}`)
        .set('Authorization', `Bearer ${profissionalToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Admin GET /api/applications/admin/all should list all applications', async () => {
      const response = await request(app)
        .get('/api/applications/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.applications)).toBe(true);
    });
  });

  describe('Role-based Access Control', () => {
    test('PROFISSIONAL cannot access EMPRESA routes', async () => {
      const response = await request(app)
        .get('/api/opportunities/my')
        .set('Authorization', `Bearer ${profissionalToken}`);

      expect(response.status).toBe(403);
    });

    test('EMPRESA cannot access PROFISSIONAL routes', async () => {
      const response = await request(app)
        .get('/api/applications/my')
        .set('Authorization', `Bearer ${empresaToken}`);

      expect(response.status).toBe(403);
    });

    test('ADMIN can access all routes', async () => {
      const responses = await Promise.all([
        request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/opportunities/admin/all').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/applications/admin/all').set('Authorization', `Bearer ${adminToken}`),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Platform Detection', () => {
    test('Should detect mobile platform from header', async () => {
      const response = await request(app)
        .get('/health')
        .set('x-platform', 'mobile');

      expect(response.status).toBe(200);
    });

    test('Should detect web platform from header', async () => {
      const response = await request(app)
        .get('/health')
        .set('x-platform', 'web');

      expect(response.status).toBe(200);
    });
  });
});