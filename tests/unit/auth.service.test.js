import AuthService from '../../src/modules/auth/auth.service.js';
import User from '../../src/models/user.js';
import RefreshToken from '../../src/models/refreshToken.js';
import jwt from 'jsonwebtoken';

// Mock RefreshToken.create to prevent database hanging
RefreshToken.create = async (data) => ({ ...data, save: async () => {} });


describe('AuthService', () => {
  test('login throws on missing user', async () => {
    User.findOne = () => ({ select: async () => null });
    await expect(AuthService.login({ email: 'x@y.com', password: 'p' })).rejects.toThrow('Invalid credentials');
  });

  test('login throws on invalid password', async () => {
    const fakeUser = { comparePassword: async () => false };
    User.findOne = () => ({ select: async () => fakeUser });
    await expect(AuthService.login({ email: 'x@y.com', password: 'p' })).rejects.toThrow('Invalid credentials');
  });

  test('login returns tokens on success', async () => {
    const fakeUser = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com', role: 'student', name: 'Name', profileImage: {}, comparePassword: async () => true, save: async () => fakeUser };
    User.findOne = () => ({ select: async () => fakeUser });
    jwt.sign = (...args) => {
      // first call -> access, second -> refresh
      if (!jwt._c) { jwt._c = 1; return 'accessToken'; }
      return 'refreshToken';
    };

    const result = await AuthService.login({ email: 'a@b.com', password: 'p' });
    expect(result.accessToken).toBe('accessToken');
    expect(result.refreshToken).toBe('refreshToken');
    expect(result.payload.email).toBe('a@b.com');
  });
});
