import { QuestionType, State } from '@app/app.constants';
import { Game, GameDocument, gameSchema } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { QuestionService } from '@app/services/question/question.service';
import { Logger } from '@nestjs/common';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
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
            providers: [GameService, Logger, QuestionService],
        }).compile();

        service = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
        connection = await module.get(getConnectionToken());
        await gameModel.deleteMany();
    });

    afterEach((done) => {
        setTimeout(async () => {
            await connection.close();
            await mongoServer.stop();
            done();
        }, delayBeforeClosingConnection);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(gameModel).toBeDefined();
    });

    it('getGame(ADMIN_PAGE) return game with the specified index code', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        expect(await service.getGame(game.id, State.AdminPage)).toEqual(expect.objectContaining(game));
    });

    it('getGame(NORMAL_PAGE) return game with the specified index code', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        delete game.isVisible;
        delete game.questions[0].choices[0].isCorrect;
        delete game.questions[0].choices[1].isCorrect;
        expect(await service.getGame(game.id, State.NormalPage)).toEqual(expect.objectContaining(game));
    });

    it('getGame(CREATE_LOBBY) return game with the specified index code', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        delete game.isVisible;
        delete game.lastModification;
        expect(await service.getGame(game.id, State.CreateLobby)).toEqual(expect.objectContaining(game));
    });

    it('getGame(EXPORT) return game with the specified index code', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        delete game.isVisible;
        expect(await service.getGame(game.id, State.Export)).toEqual(expect.objectContaining(game));
    });

    it('getGame() should reject if the game cannot be found', async () => {
        await expect(service.getGame('1', State.Export)).rejects.toBeTruthy();
    });

    it('getAllGames(true) should return all the games', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        const bestGame = getFakeGame();
        game.title = 'bonjour2';
        game.questions.push(question);
        await gameModel.create(game);
        bestGame.title = 'bonjour';
        bestGame.questions.push(question);
        await gameModel.create(bestGame);
        expect(await service.getAllGames(true)).toEqual(expect.arrayContaining([expect.objectContaining(game), expect.objectContaining(bestGame)]));
    });

    it('getAllGames(false) should return all the games visible', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        const bestGame = getFakeGame();
        game.title = 'bonjour2';
        game.questions.push(question);
        await gameModel.create(game);
        bestGame.title = 'bonjour';
        bestGame.questions.push(question);
        bestGame.isVisible = false;
        await gameModel.create(bestGame);
        delete game.isVisible;
        delete game.questions[0].choices[0].isCorrect;
        delete game.questions[0].choices[1].isCorrect;
        const gameReturn = await service.getAllGames(false);
        expect(gameReturn).toEqual(expect.arrayContaining([expect.objectContaining(game)]));
        expect(gameReturn.length).toEqual(1);
    });

    it('CreateGame() should have an id equal to _id', async () => {
        const game = getFakeGame();
        game.questions.push(getFakeQuestion());
        const gameSave = await service.createGame(game);
        const gameDocument = await gameModel.findOne({ id: gameSave.id });

        expect(gameDocument.id).toBeDefined();
        // Retrait de l'erreur lint car le _id est obligatoire pour la base de donnee
        // eslint-disable-next-line no-underscore-dangle
        expect(gameDocument.id).toBe(gameDocument._id.toString());
    });

    it('createGame() should fail if the questions are invalid', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        question.points = -4;
        game.questions.push(question);
        await expect(service.createGame(game)).rejects.toBeTruthy();
        const newGame = getFakeGame();
        await expect(service.createGame(newGame)).rejects.toBeTruthy();
    });

    it('createGame() should fail if the title already exist in the database', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        const newGame = getFakeGame();
        newGame.title = game.title;
        game.questions.push(question);
        newGame.questions.push(question);
        await gameModel.create(game);
        await expect(service.createGame(newGame)).rejects.toBeTruthy();
    });

    it('createGame() should fail if the duration is bellow 10', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        game.duration = -1;
        await expect(service.createGame(game)).rejects.toBeTruthy();
    });

    it('createGame() should fail if the duration is above 60', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        game.duration = 62;
        await expect(service.createGame(game)).rejects.toBeTruthy();
    });

    it('createGame() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'create').mockRejectedValue('');
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await expect(service.createGame(game)).rejects.toBeTruthy();
    });

    it('createGame() should add a game in the DB', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await service.createGame(game);
        expect(await gameModel.countDocuments()).toEqual(1);
    });

    it('updateGame() should modify the game in the DB if it is found', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);

        await service.updateGame(game.id, { id: game.id, title: 'pi' });
        expect((await gameModel.findOne({ id: game.id })).title).toEqual('pi');
        // retrait des nombres magiques pour faire les testes
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        question.points = 40;
        await service.updateGame(game.id, { id: game.id, questions: [question] });
        expect((await gameModel.findOne({ id: game.id })).questions[0]).toEqual(question);

        // retrait des nombres magiques pour faire les testes
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        await service.updateGame(game.id, { id: game.id, duration: 40 });

        // retrait des nombres magiques pour faire les testes
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect((await gameModel.findOne({ id: game.id })).duration).toEqual(40);
    });

    it('updateGame() should fail if the title already exist', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.updateGame(game.id, { id: game.id, title: game.title })).rejects.toBeTruthy();
    });

    it('updateGame() should fail if the duration is bellow 10 or above 60', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.updateGame(game.id, { id: game.id, duration: -4 })).rejects.toBeTruthy();
        await expect(service.updateGame(game.id, { id: game.id, duration: 62 })).rejects.toBeTruthy();
    });

    it('updateGame() should fail if there are no questions or there is invalid questions', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.updateGame(game.id, { id: game.id, questions: [] })).rejects.toBeTruthy();

        question.points = -4;
        await expect(service.updateGame(game.id, { id: game.id, questions: [question] })).rejects.toBeTruthy();
    });

    it('updateGame() should fail if the id is invalid', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.updateGame('42', { id: '42', title: 'pi' })).rejects.toBeTruthy();
    });

    it('updateGame() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'findOne').mockRejectedValue('');
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.updateGame(game.id, { id: game.id, title: 'pi' })).rejects.toBeTruthy();
    });

    it('deleteGame() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'deleteOne').mockRejectedValue('');
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.deleteGame(game.id)).rejects.toBeTruthy();
    });

    it('deleteGame() should fail if the id is not found', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await expect(service.deleteGame('pi')).rejects.toBeTruthy();
    });

    it('deleteGame() should delete the game if the id is found', async () => {
        const question = getFakeQuestion();
        const game = getFakeGame();
        game.questions.push(question);
        await gameModel.create(game);
        await service.deleteGame(game.id);
        expect(await gameModel.countDocuments()).toEqual(0);
    });
});

const getFakeQuestion = (): Question => ({
    choices: [
        { text: getRandomString(), isCorrect: true },
        { text: getRandomString(), isCorrect: false },
    ],
    points: 10,
    text: getRandomString(),
    type: QuestionType.QCM,
});

const getFakeGame = (): Game => ({
    id: getRandomString(),
    title: getRandomString(),
    description: getRandomString(),
    lastModification: '',
    duration: 10,
    questions: [],
    isVisible: true,
});

const delayBeforeClosingConnection = 200;
const base36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(base36).substring(2);
