import { AuthService } from '@app/services/auth/auth.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    describe('authenticate', () => {
        it('should authenticate and return true', async () => {
            const passwd = 'valid_password';
            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const mockAuthServiceAuthenticate = jest.spyOn(authService, 'authenticate').mockResolvedValue(true);

            await authController.authenticate(passwd, mockResponse as Response);

            expect(mockAuthServiceAuthenticate).toHaveBeenCalledWith(passwd);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith(true);
        });

        it('should handle authentication failure', async () => {
            const passwd = 'invalid_password';
            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const mockAuthServiceAuthenticate = jest.spyOn(authService, 'authenticate').mockRejectedValue(new Error('Authentication failed'));

            await authController.authenticate(passwd, mockResponse as Response);

            expect(mockAuthServiceAuthenticate).toHaveBeenCalledWith(passwd);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
        });
    });
});
