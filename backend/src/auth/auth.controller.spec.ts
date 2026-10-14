import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    signup: vi.fn<(dto: unknown) => Promise<string>>(),
    signin: vi.fn<(dto: unknown) => Promise<string>>(),
  };
  const controller = new AuthController(authService as unknown as AuthService);

  it('delegates sign-up and sign-in to AuthService', async () => {
    authService.signup.mockResolvedValue('signed-up');
    authService.signin.mockResolvedValue('signed-in');
    const signup = {
      name: 'Jane',
      email: 'jane@example.com',
      password: 'secret1!',
    };
    const signin = { email: 'jane@example.com', password: 'secret1!' };

    await expect(controller.signup(signup)).resolves.toBe('signed-up');
    await expect(controller.signin(signin)).resolves.toBe('signed-in');
    expect(authService.signup).toHaveBeenCalledWith(signup);
    expect(authService.signin).toHaveBeenCalledWith(signin);
  });

  it('returns the authenticated user from the request on /profile', () => {
    const user = { userId: 'user-id', email: 'jane@example.com' };

    expect(controller.getProfile({ user })).toEqual({
      message: 'Protected endpoint accessed successfully',
      user,
    });
  });
});
