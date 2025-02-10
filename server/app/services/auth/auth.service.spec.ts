import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService],
        }).compile();

        authService = module.get<AuthService>(AuthService);
    });

    describe('authenticate', () => {
        it('should return true for a valid password', async () => {
            const isValid = await authService.authenticate('admin');
            expect(isValid).toBe(true);
        });

        it('should return false for an invalid password', async () => {
            const isValid = await authService.authenticate('invalid_password');
            expect(isValid).toBe(false);
        });
    });
});
