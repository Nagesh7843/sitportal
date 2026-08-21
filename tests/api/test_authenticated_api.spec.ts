import { test, expect } from '@playwright/test';

test.describe('API Authentication Verification', () => {
  test('Backend rejects requests without JWT token', async ({ request }) => {
    // Attempt to hit the dashboard API which requires authentication
    const response = await request.get('http://localhost:8080/api/v1/students');
    
    // We expect a 401 Unauthorized or 403 Forbidden
    expect(response.status()).toBe(401);
  });

  // Note: An authenticated test would involve capturing the JWT from the login POST
  // and passing it into the headers here. 
});
