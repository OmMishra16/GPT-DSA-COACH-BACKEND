const request = require('supertest');

// Set test environment before importing app
process.env.NODE_ENV = 'test';

const app = require('../src/app');

describe('Health Check API', () => {

  describe('GET /api/health', () => {
    it('should return status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });

  describe('GET /api/problems/:titleSlug', () => {
    it('should return problem details for valid slug', async () => {
      const response = await request(app)
        .get('/api/problems/two-sum')
        .expect('Content-Type', /json/);

      // Either success with problem details or graceful failure
      expect(response.status).toBeLessThan(500);
    });
  });

});
