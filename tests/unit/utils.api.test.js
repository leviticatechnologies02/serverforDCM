// Use dynamic import so tests run under CommonJS Jest runner while importing ESM modules
describe('ApiResponse utils', () => {
  let successResponse, errorResponse;

  beforeAll(async () => {
    const mod = await import('../../src/utils/ApiResponse.js');
    successResponse = mod.successResponse;
    errorResponse = mod.errorResponse;
  });

  const resFactory = () => ({
    status(code) { this._status = code; return this; },
    json(payload) { this._payload = payload; return this; }
  });

  test('successResponse returns standard success structure', () => {
    const res = resFactory();
    const r = successResponse(res, { message: 'OK', data: { a: 1 }, status: 201 });
    expect(res._status).toBe(201);
    expect(res._payload).toEqual({ success: true, message: 'OK', data: { a: 1 } });
    expect(r).toBe(res);
  });

  test('errorResponse returns standard error structure', () => {
    const res = resFactory();
    const r = errorResponse(res, { message: 'Bad', errors: ['x'], status: 400 });
    expect(res._status).toBe(400);
    expect(res._payload).toEqual({ success: false, message: 'Bad', errors: ['x'] });
    expect(r).toBe(res);
  });
});
