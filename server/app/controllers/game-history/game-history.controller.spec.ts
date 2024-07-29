import { GameHistoryDbService } from '@app/services/game-history/game-history.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GameHistoryController } from './game-history.controller';

describe('GameHistoryController', () => {
    let controller: GameHistoryController;
    let service: GameHistoryDbService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameHistoryController],
            providers: [
                {
                    provide: GameHistoryDbService,
                    useValue: {
                        getAllGameHistories: jest.fn().mockResolvedValue(['testData']),
                        deleteAllHistory: jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();

        controller = module.get<GameHistoryController>(GameHistoryController);
        service = module.get<GameHistoryDbService>(GameHistoryDbService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getHistory', () => {
        it('should return an array of game histories', async () => {
            expect(await controller.getHistory()).toEqual(['testData']);
            expect(service.getAllGameHistories).toHaveBeenCalled();
        });
    });

    describe('deleteHistory', () => {
        it('should call deleteAllHistory', async () => {
            await controller.deleteHistory();
            expect(service.deleteAllHistory).toHaveBeenCalled();
        });
    });
});
