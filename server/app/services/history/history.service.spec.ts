import { ErrorType } from '@app/app.constants';
import { History, HistoryDocument, historySchema } from '@app/model/database/history';
import { CreateHistoryDto } from '@app/model/dto/history/create-history.dto';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { HistoryService } from './history.service';

const DELAY_BEFORE_CLOSING_CONNECTION = 200;

describe('HistoryService', () => {
    let historyModel: Model<HistoryDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;
    let historyService: HistoryService;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: History.name, schema: historySchema }]),
            ],
            providers: [HistoryService],
        }).compile();

        historyService = module.get<HistoryService>(HistoryService);
        historyModel = module.get<Model<HistoryDocument>>(getModelToken(History.name));
        connection = await module.get(getConnectionToken());
    });

    afterEach((done) => {
        setTimeout(async () => {
            await connection.close();
            await mongoServer.stop();
            done();
        }, DELAY_BEFORE_CLOSING_CONNECTION);
    });

    describe('addHistory', () => {
        it('should add history successfully', async () => {
            const createHistoryDto: CreateHistoryDto = {
                gameTitle: 'Sample Game',
                date: '2023-11-15T10:30:00.000Z',
                numberOfPlayers: 5,
                bestScore: 95,
            };

            await historyModel.create(createHistoryDto);
            jest.spyOn(historyModel, 'create');

            await historyService.addHistory(createHistoryDto);

            expect(historyModel.create).toHaveBeenCalledWith(createHistoryDto);
        });

        it('should reject with InternalServerError on save failure', async () => {
            const createHistoryDto: CreateHistoryDto = {
                gameTitle: 'Sample Game',
                date: '2023-11-15T10:30:00.000Z',
                numberOfPlayers: 5,
                bestScore: 95,
            };

            jest.spyOn(historyModel, 'create').mockRejectedValue('Une erreur interne du serveur est survenue');
            await expect(historyService.addHistory(createHistoryDto)).rejects.toBeTruthy();

            jest.spyOn(historyModel, 'create').mockRejectedValue('');
            await expect(historyService.addHistory(createHistoryDto)).rejects.toThrowError(ErrorType.InternalServerError);
        });
    });

    describe('getAllHistory', () => {
        it('should get all history successfully', async () => {
            const mockHistories: History[] = [
                {
                    gameTitle: 'First Game',
                    date: '2023-11-15T10:30:00.000Z',
                    numberOfPlayers: 5,
                    bestScore: 95,
                },
                {
                    gameTitle: 'Second Game',
                    date: '2023-11-16T12:45:00.000Z',
                    numberOfPlayers: 8,
                    bestScore: 87,
                },
                {
                    gameTitle: 'Third Game',
                    date: '2023-11-17T15:15:00.000Z',
                    numberOfPlayers: 3,
                    bestScore: 92,
                },
            ];

            jest.spyOn(historyModel, 'find').mockResolvedValue(mockHistories);

            const result = await historyService.getAllHistory();

            expect(result).toEqual(mockHistories);
            expect(historyModel.find).toHaveBeenCalled();
        });

        it('should reject with InternalServerError on find failure', async () => {
            jest.spyOn(historyModel, 'find').mockRejectedValue(new Error('Une erreur interne du serveur est survenue'));

            await expect(historyService.getAllHistory()).rejects.toThrowError(ErrorType.InternalServerError);
        });
    });

    describe('deleteAllHistories', () => {
        it('should delete all histories successfully', async () => {
            jest.spyOn(historyModel, 'deleteMany');
            await historyService.deleteAllHistories();

            expect(historyModel.deleteMany).toHaveBeenCalled();
        });

        it('should reject with InternalServerError on deleteMany failure', async () => {
            jest.spyOn(historyModel, 'deleteMany').mockRejectedValue(new Error('Une erreur interne du serveur est survenue'));

            await expect(historyService.deleteAllHistories()).rejects.toThrowError(ErrorType.InternalServerError);

            jest.spyOn(historyModel, 'deleteMany').mockRejectedValue('');
            await expect(historyService.deleteAllHistories()).rejects.toThrowError(ErrorType.InternalServerError);
        });
    });
});
