import { Admin } from '@app/model/schema/admin/admin.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { AdminService } from './admin.service';

describe('AdminService', () => {
    let service: AdminService;
    let adminModel: Model<Admin>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: getModelToken(Admin.name),
                    useValue: {
                        findOne: jest.fn(() => ({}) as Query<unknown, Admin>),
                    },
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        adminModel = module.get<Model<Admin>>(getModelToken(Admin.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should validate password', async () => {
        const findOneMock = jest.spyOn(adminModel, 'findOne').mockResolvedValueOnce({
            password: 'mockedPassword',
        } as Partial<Admin>);

        const result = await service.validatePassword('mockedPassword');

        expect(findOneMock).toHaveBeenCalled();
        expect(result).toBe(true);
    });
});
