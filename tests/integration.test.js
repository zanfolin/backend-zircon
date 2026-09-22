import request from 'supertest';
import app from '../src/app.js';
import db from '../src/config/database.js';
import { tokenService } from '../src/services/tokenService.js';
import { passwordService } from '../src/services/passwordService.js';
import { validationService } from '../src/services/validationService.js';

// Helper to generate valid CPF
const generateValidCPF = () => {
  // Generate 9 random digits
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i]) * (11 - i);
  }
  sum += digit1 * 2;
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  
  return base + digit1 + digit2;
};

// Helper to generate valid CNPJ
const generateValidCNPJ = () => {
  // Generate 12 random digits
  const base = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
  
  // Calculate first check digit
  // Weights: 5,4,3,2,9,8,7,6,5,4,3,2 (applied left to right to the 12 base digits)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  // Calculate second check digit
  // Weights: 6,5,4,3,2,9,8,7,6,5,4,3,2 (applied left to right to 13 digits: 12 base + first check digit)
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  // First 12 digits with weights2[0] to weights2[11]
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * weights2[i];
  }
  // First check digit with weights2[12]
  sum += digit1 * weights2[12];
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return base + digit1 + digit2;
};

// Helper to generate unique test data with valid documents
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
      document_number: generateValidCNPJ(),
      full_name: `Empresa ${base}`,
    };
  }
  
  return {
    email: `profissional_${base}@test.com`,
    password: 'Senha123!',
    user_type: 'PROFISSIONAL',
    document_type: 'CPF',
    document_number: generateValidCPF(),
    full_name: `Profissional ${base}`,
  };
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
      expect(response.body.data.user.email).toBe(testProfissionalData.email);
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
      // Create a second opportunity for this test
      const secondOpportunity = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${empresaToken}`)
        .send({
          job_title: 'Second Opportunity',
          job_description: 'Test',
          company_sector: 'Tecnologia',
          payment_value: 5000,
          work_modality: 'HOME_OFFICE',
        });
      const secondOpportunityId = secondOpportunity.body.data.opportunity.id;

      // Create application for the second opportunity
      const newApp = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({ vacancy_id: secondOpportunityId });

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
      // Create a third opportunity for this test
      const thirdOpportunity = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${empresaToken}`)
        .send({
          job_title: 'Third Opportunity',
          job_description: 'Test',
          company_sector: 'Tecnologia',
          payment_value: 5000,
          work_modality: 'HOME_OFFICE',
        });
      const thirdOpportunityId = thirdOpportunity.body.data.opportunity.id;

      // Create application for the third opportunity
      const newApp = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${profissionalToken}`)
        .send({ vacancy_id: thirdOpportunityId });

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
      // Try to access EMPRESA-only route (list own opportunities)
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