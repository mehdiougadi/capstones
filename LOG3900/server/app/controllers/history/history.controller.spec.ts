import { HistoryService } from '@app/services/history/history.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { HistoryController } from './history.controller';

const mockHistoryService = {
    addHistory: jest.fn(),
    getAllHistory: jest.fn(),
    deleteAllHistories: jest.fn(),
};

describe('HistoryController', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [
                {
                    provide: HistoryService,
                    useValue: mockHistoryService,
                },
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('POST /history', () => {
        it('should create a new history record', async () => {
            const createHistoryDto = {
                gameTitle: 'Sample Game',
                date: '2023-11-15T10:30:00.000Z',
                numberOfPlayers: 5,
                bestScore: 95,
            };
            mockHistoryService.addHistory.mockResolvedValueOnce('some value');

            const response = await request(app.getHttpServer()).post('/history').send(createHistoryDto).expect(HttpStatus.OK);

            expect(response.body.message).toEqual('History created successfully');
            expect(mockHistoryService.addHistory).toHaveBeenCalledWith(createHistoryDto);
        });

        it('should handle error during history creation', async () => {
            const createHistoryDto = {
                gameTitle: 'Sample Game',
                date: '2023-11-15T10:30:00.000Z',
                numberOfPlayers: 5,
                bestScore: 95,
            };
            mockHistoryService.addHistory.mockRejectedValueOnce(new Error('Some error during creation'));

            const response = await request(app.getHttpServer()).post('/history').send(createHistoryDto).expect(HttpStatus.INTERNAL_SERVER_ERROR);

            expect(response.body.error).toEqual('Internal server error creating history');
            expect(mockHistoryService.addHistory).toHaveBeenCalledWith(createHistoryDto);
        });
    });

    describe('GET /history', () => {
        it('should get all history records', async () => {
            const mockHistories = [
                {
                    gameTitle: 'First Game',
                    date: '2023-11-15T10:30:00.000Z',
                    numberOfPlayers: 5,
                    bestScore: 95,
                },
            ];
            mockHistoryService.getAllHistory.mockResolvedValueOnce(mockHistories);

            const response = await request(app.getHttpServer()).get('/history').expect(HttpStatus.OK);

            expect(response.body).toEqual(mockHistories);
            expect(mockHistoryService.getAllHistory).toHaveBeenCalled();
        });

        it('should handle error during getting histories', async () => {
            mockHistoryService.getAllHistory.mockRejectedValueOnce(new Error('Some error during getting histories'));

            const response = await request(app.getHttpServer()).get('/history').expect(HttpStatus.INTERNAL_SERVER_ERROR);

            expect(response.body.error).toEqual('Internal server error getting histories');
            expect(mockHistoryService.getAllHistory).toHaveBeenCalled();
        });
    });

    describe('DELETE /history', () => {
        it('should delete all history records', async () => {
            mockHistoryService.deleteAllHistories.mockResolvedValueOnce('some value');

            const response = await request(app.getHttpServer()).delete('/history').expect(HttpStatus.OK);

            expect(response.body.message).toEqual('All histories deleted successfully');
            expect(mockHistoryService.deleteAllHistories).toHaveBeenCalled();
        });

        it('should handle error during deleting histories', async () => {
            mockHistoryService.deleteAllHistories.mockRejectedValueOnce(new Error('Some error during deleting histories'));

            const response = await request(app.getHttpServer()).delete('/history').expect(HttpStatus.INTERNAL_SERVER_ERROR);

            expect(response.body.error).toEqual('Internal server error deleting histories');
            expect(mockHistoryService.deleteAllHistories).toHaveBeenCalled();
        });
    });
});
