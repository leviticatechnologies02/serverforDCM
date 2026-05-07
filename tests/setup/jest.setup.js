// Jest setup file: configure globals, mocks, timeouts

// Set mock environment variables for test execution
process.env.ACCESS_SECRET = process.env.ACCESS_SECRET || 'test_access_secret_key_32_chars_at_least';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'test_refresh_secret_key_32_chars_at_least';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
process.env.RAZORPAY_INTERNSHIP_WEBHOOK_SECRET = process.env.RAZORPAY_INTERNSHIP_WEBHOOK_SECRET || 'mock_internship_webhook_secret';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Move jest calls inside lifecycle to avoid running before Jest initializes
beforeAll(() => {
  if (typeof jest !== 'undefined' && typeof jest.setTimeout === 'function') {
    jest.setTimeout(20000);
  }

  // silence console.info in tests (if spy available)
  if (typeof jest !== 'undefined' && jest.spyOn) {
    jest.spyOn(console, 'info').mockImplementation(() => {});
  }
});

afterAll(() => {
  if (console.info && console.info.mockRestore) console.info.mockRestore();
});

