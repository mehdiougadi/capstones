import { GameHistory, gameHistorySchema } from '@app/model/database/game-history';
import { GameHistoryDbService } from '@app/services/game-history/game-history.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('GameHistoryDbService.deleteAllHistory', () => {
    let mongod: MongoMemoryServer;
    let gameHistoryService: GameHistoryDbService;
    let gameHistoryModel: mongoose.Model<GameHistory>;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        gameHistoryModel = mongoose.model<GameHistory>('GameHistory', gameHistorySchema);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongod.stop();
    });

    beforeEach(async () => {
        gameHistoryService = new GameHistoryDbService(gameHistoryModel);
        await gameHistoryModel.deleteMany({});
        await gameHistoryService.addGameToHistory({ quizName: 'Quiz 1', startTime: new Date(), playerCount: 3, topScore: 100 });
        await gameHistoryService.addGameToHistory({ quizName: 'Quiz 2', startTime: new Date(), playerCount: 5, topScore: 150 });
    });

    it('should delete all game history records', async () => {
        const allHistoriesBeforeDelete = await gameHistoryService.getAllGameHistories();
        expect(allHistoriesBeforeDelete.length).toBeGreaterThan(0);

        const deleteResult = await gameHistoryService.deleteAllHistory();
        expect(deleteResult).toBe(true);

        const allHistoriesAfterDelete = await gameHistoryService.getAllGameHistories();
        expect(allHistoriesAfterDelete.length).toBe(0);
    });
    it('should create and retrieve game history', async () => {
        const createDto = { quizName: 'New Quiz', startTime: new Date(), playerCount: 3, topScore: 200 };
        await gameHistoryService.addGameToHistory(createDto);

        const histories = await gameHistoryService.getAllGameHistories();
        expect(histories.length).toBe(3);
        expect(histories[0].quizName).toBe('Quiz 1');
    });
});
