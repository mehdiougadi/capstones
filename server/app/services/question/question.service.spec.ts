import { QuestionType } from '@app/app.constants';
import { Game, GameDocument, gameSchema } from '@app/model/database/game';
import { Logger } from '@nestjs/common';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { QuestionService } from './question.service';

const DELAY_BEFORE_CLOSING_CONNECTION = 200;

describe('QuestionService', () => {
    let service: QuestionService;
    let gameModel: Model<GameDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]),
            ],
            providers: [QuestionService, Logger],
        }).compile();

        service = module.get<QuestionService>(QuestionService);
        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
        connection = await module.get(getConnectionToken());
    });

    afterEach((done) => {
        setTimeout(async () => {
            await connection.close();
            await mongoServer.stop();
            done();
        }, DELAY_BEFORE_CLOSING_CONNECTION);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(gameModel).toBeDefined();
    });

    it('getQuestion(true) return Question with the specified index code', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        expect(await service.getQuestion(game.id, 0, true)).toEqual(expect.objectContaining(question));
    });

    it('getQuestion(false) return Question with the specified index code without isCorrect', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        delete question.choices[0].isCorrect;
        delete question.choices[1].isCorrect;
        expect(await service.getQuestion(game.id, 0, false)).toEqual(expect.objectContaining(question));
    });

    it('addQuestion() should add the Question to the DB', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        await gameModel.create(game);
        await service.addQuestion(game.id, question);
        const newGame = await gameModel.findOne({ id: game.id });
        expect(newGame.questions.length).toEqual(1);
    });

    it('addQuestion() should not add the Question to the DB if the points are invalid', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        await gameModel.create(game);
        question.points = 19;
        await expect(service.addQuestion(game.id, question)).rejects.toBeTruthy();
        question.points = 110;
        await expect(service.addQuestion(game.id, question)).rejects.toBeTruthy();
        question.points = -10;
        await expect(service.addQuestion(game.id, question)).rejects.toBeTruthy();
    });

    it('addQuestion() should not add the Question to the DB if the number of answer is 0 or equal to the number of choice', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        await gameModel.create(game);
        question.choices[1].isCorrect = true;
        await expect(service.addQuestion(game.id, question)).rejects.toBeTruthy();
        question.choices[1].isCorrect = false;
        question.choices[0].isCorrect = false;
        await expect(service.addQuestion(game.id, question)).rejects.toBeTruthy();
    });

    it('addQuestion() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'findOne').mockRejectedValue('');
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        await gameModel.create(game);
        await expect(service.addQuestion(game.id, question)).rejects.toBeTruthy();
    });

    it('deleteQuestion() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'findOne').mockRejectedValue('');
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);

        await expect(service.deleteQuestion(game.id, 0)).rejects.toBeTruthy();
    });

    it('deleteQuestion() should not remove any Question to the DB if the index does not match anything', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.deleteQuestion(game.id, 2)).rejects.toBeTruthy();
    });

    it('deleteQuestion() should not remove the Question to the DB if the game has only one question', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.deleteQuestion(game.id, 0)).rejects.toBeTruthy();
    });

    it('deleteQuestion() should remove the Question to the DB if the index match something', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        game.questions.push(question);
        await gameModel.create(game);
        await service.deleteQuestion(game.id, 0);
        const newGame = await gameModel.findOne({ id: game.id });
        expect(newGame.questions.length).toEqual(1);
    });

    it('modifyQuestion() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'findOne').mockRejectedValue('');
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        const newQuestion = getFakeQuestion(QuestionType.QCM);
        await expect(service.modifyQuestion(game.id, 0, newQuestion)).rejects.toBeTruthy();
    });

    it('modifyQuestion() should fail if Question does not exist', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        await gameModel.create(game);
        await expect(service.modifyQuestion(game.id, 0, question)).rejects.toBeTruthy();
    });

    it('modifyQuestion() should fail if the game does not exist anymore', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        await expect(service.modifyQuestion(game.id, 0, question)).rejects.toBeTruthy();
    });

    it('modifyQuestion() should not modify the Question to the DB if the points are invalid', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        const newQuestion = getFakeQuestion(QuestionType.QCM);
        game.questions.push(question);
        await gameModel.create(game);
        newQuestion.points = 19;
        await expect(service.modifyQuestion(game.id, 0, newQuestion)).rejects.toBeTruthy();
        newQuestion.points = 110;
        await expect(service.modifyQuestion(game.id, 0, newQuestion)).rejects.toBeTruthy();
        newQuestion.points = -10;
        await expect(service.modifyQuestion(game.id, 0, newQuestion)).rejects.toBeTruthy();
    });

    it('modifyQuestion() should not modify the Question to the DB if the number of answer is 0 or equal to the number of choice', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        const newQuestion = getFakeQuestion(QuestionType.QCM);
        game.questions.push(question);
        await gameModel.create(game);
        newQuestion.choices[1].isCorrect = true;
        await expect(service.modifyQuestion(game.id, 0, newQuestion)).rejects.toBeTruthy();
        newQuestion.choices[1].isCorrect = false;
        newQuestion.choices[0].isCorrect = false;
        await expect(service.modifyQuestion(game.id, 0, newQuestion)).rejects.toBeTruthy();
    });

    it('modifyQuestion() should modify the Question to the DB', async () => {
        const question = getFakeQuestion(QuestionType.QRL);
        const game = getFakeGame();
        const newQuestion = getFakeQuestion(QuestionType.QRL);
        game.questions.push(question);
        await gameModel.create(game);
        newQuestion.text = 'ok';
        await service.modifyQuestion(game.id, 0, newQuestion);
        expect((await gameModel.findOne({ id: game.id })).questions[0].text).toEqual('ok');
    });

    it('getAllQuestion() return all Question of a game', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        game.questions.push(question);
        await gameModel.create(game);
        expect(await service.getAllQuestion(game.id, true)).toEqual(expect.objectContaining([question, question]));
    });

    it('getAllQuestion() should throw an error if the id of the game is not found', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.getAllQuestion(game.id + 'p', true)).rejects.toBeTruthy();
    });

    it('getQuestion() should throw an error if the id of the game is not found', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.getQuestion(game.id + 'p', 0, true)).rejects.toBeTruthy();
    });

    it('getQuestion() should throw an error if the index is not in the array of questions', async () => {
        const question = getFakeQuestion(QuestionType.QCM);
        const game = getFakeGame();
        game.questions.push(question);
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.getQuestion(game.id, 2, true)).rejects.toBeTruthy();
    });
});

const getFakeQuestion = (type: QuestionType) => {
    return {
        text: getRandomString(),
        points: 10,
        type,
        choices: [
            { text: 'choice1', isCorrect: true, selected: true },
            { text: 'choice2', isCorrect: false, selected: false },
        ],
    };
};

const getFakeGame = (): Game => ({
    id: getRandomString(),
    title: getRandomString(),
    description: getRandomString(),
    lastModification: '',
    duration: 10,
    questions: [],
    isVisible: true,
});

const BASE_36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);
