import { AdminService } from '@app/services/admin-service/admin.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';

describe('AdminController', () => {
    let controller: AdminController;
    let adminService: AdminService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                AdminService,
                {
                    provide: getModelToken('Admin'),
                    useValue: {},
                },
                Logger,
            ],
        }).compile();

        controller = module.get<AdminController>(AdminController);
        adminService = module.get<AdminService>(AdminService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('verifyPassword', () => {
        it('should call validatePassword', async () => {
            const passwordDto = { password: 'password123' };
            const expectedResult = true;
            jest.spyOn(adminService, 'validatePassword').mockResolvedValue(expectedResult);
            const result = await controller.verifyPassword(passwordDto);
            expect(adminService.validatePassword).toHaveBeenCalledWith(passwordDto.password);
            expect(result).toEqual(expectedResult);
        });
    });
});
