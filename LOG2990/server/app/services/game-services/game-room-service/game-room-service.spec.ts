/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable object-shorthand */
import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { QuestionDbService } from '@app/services/question-service/question.service';
import { QuizDbService } from '@app/services/quiz-service/quiz.service';
import { Player } from '@common/classes/player';
import { TIMEOUT } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Quiz } from '@common/interfaces/quiz';
import { Test, TestingModule } from '@nestjs/testing';
import { GameServiceRoom } from './game-room-service';

describe('GameServiceRoom', () => {
    let gameServiceRoom: GameServiceRoom;
    let gameConnectionGatewayMock: Partial<GameConnectionGateway>;
    let quizDbServiceMock: Partial<QuizDbService>;
    let questionDbServiceMock: Partial<QuestionDbService>;
    let listRooms: Room[];
    let createRoomDto: Room;
    let mockQuiz: Quiz;
    let mockPlayers: Player[];
    beforeEach(async () => {
        gameConnectionGatewayMock = {
            sendRoomState: jest.fn(),
            startGame: jest.fn(),
            banPlayerFromRoom: jest.fn(),
        };

        quizDbServiceMock = {
            getQuiz: jest.fn().mockResolvedValue({
                duration: 30,
                questions: [],
            }),
            generateRandomQuiz: jest.fn().mockImplementation((questions) => {
                // Vous pouvez mettre en œuvre la logique de génération de quiz ici si nécessaire.
                return {
                    // Mock d'un objet de quiz pour le test
                    id: 'quizId',
                    title: 'Mock Quiz',
                    questions: questions,
                };
            }),
        };
        questionDbServiceMock = {
            generateRandomQuestion: jest.fn().mockResolvedValue([]),
        };
        mockQuiz = {
            _id: 'quizId',
            title: 'Sample Quiz',
            description: 'A sample quiz for testing',
            questions: [],
            duration: 30,
            visible: true,
            lastModification: new Date(),
        };
        mockPlayers = [new Player('mario')];
        createRoomDto = {
            id: 'room1',
            accessCode: 'ACCESS123',
            isPanicMode: false,
            quiz: mockQuiz,
            listPlayers: mockPlayers,
            randomMode: false,
            nameBanned: [],
            currentTime: 30,
            currentQuestionIndex: 0,
            isLocked: false,
            roundFinished: false,
            isTesting: false,
            isPaused: false,
            currentState: GameState.END_ROUND,
            dateCreated: new Date(),
            bestScore: 0,
            numberOfPlayers: 0,
            lockPlayerPoints: false,
            timer: setTimeout(() => {
                /* empty */
            }, TIMEOUT),
            questionStats: [],
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameServiceRoom,
                { provide: GameConnectionGateway, useValue: gameConnectionGatewayMock },
                { provide: QuizDbService, useValue: quizDbServiceMock },
                { provide: QuestionDbService, useValue: questionDbServiceMock },
            ],
        }).compile();
        gameServiceRoom = module.get<GameServiceRoom>(GameServiceRoom);
        listRooms = [];
    });
    describe('createNewGame', () => {
        it('should create a new game and add it to listRooms', async () => {
            const quizId = 'quizId';
            const isTesting = false;
            const randomMode = true;
            const randomQuestions = [];
            questionDbServiceMock.generateRandomQuestion = jest.fn().mockResolvedValue(randomQuestions);
            const mockGeneratedQuiz = {
                duration: 30,
                questions: [],
            };
            quizDbServiceMock.generateRandomQuiz = jest.fn().mockReturnValue(mockGeneratedQuiz);

            const roomId = await gameServiceRoom.createNewGame(quizId, isTesting, listRooms, randomMode);

            expect(roomId).toBeDefined();
            expect(listRooms.length).toBe(1);
            expect(listRooms[0].id).toBe(roomId);
            expect(quizDbServiceMock.generateRandomQuiz).toHaveBeenCalledWith(randomQuestions);
        });

        it('should create a new game and add it to listRooms', async () => {
            const quizId = 'quizId';
            const isTesting = false;
            const randomMode = false;

            const roomId = await gameServiceRoom.createNewGame(quizId, isTesting, listRooms, randomMode);

            expect(roomId).toBeDefined();
            expect(listRooms.length).toBe(1);
            expect(listRooms[0].id).toBe(roomId);
            expect(quizDbServiceMock.getQuiz).toHaveBeenCalledWith(quizId);
        });
    });

    describe('deleteRoom', () => {
        it('should remove the specified room from the list', () => {
            const room: Room = { id: 'room123', isTesting: false } as Room;
            listRooms.push(room);

            const result = gameServiceRoom.deleteRoom(room, listRooms);

            expect(result).toBe(true);
            expect(listRooms.length).toBe(0);
            expect(gameConnectionGatewayMock.sendRoomState).toHaveBeenCalledWith(room.id, GameState.END_ROOM);
        });
    });

    it('should initialize question stats for the room with QCM questions', () => {
        const room: Room = { id: 'room123', quiz: mockQuiz } as Room;
        const questionCount = 3;
        mockQuiz.questions = new Array(questionCount).fill({ type: QuestionType.QCM, choices: [{ text: 'Choice 1', isCorrect: true }] });

        gameServiceRoom.initializeQuestionStats(room);

        expect(room.questionStats.length).toBe(questionCount);

        room.questionStats.forEach((stat, index) => {
            expect(stat.questionIndex).toBe(index);
            expect(stat.questionType).toBe('QCM');
            expect(stat.stats).toEqual({
                'Choice 1': {
                    count: 0,
                    isCorrect: true,
                },
            });
            expect(stat.statsQRL).toBeNull();
        });
    });
    it('should initialize question stats for the room with QRL questions', () => {
        const room: Room = { id: 'room123', quiz: mockQuiz } as Room;
        const questionCount = 3;
        mockQuiz.questions = new Array(questionCount).fill({ type: QuestionType.QRL });

        gameServiceRoom.initializeQuestionStats(room);

        expect(room.questionStats.length).toBe(questionCount);

        room.questionStats.forEach((stat, index) => {
            expect(stat.questionIndex).toBe(index);
            expect(stat.questionType).toBe('QRL');
            expect(stat.stats).toEqual({});
            expect(stat.statsQRL).toEqual({
                modifiedLastSeconds: 0,
                notModifiedLastSeconds: 0,
                scores: {
                    zeroPercent: 0,
                    fiftyPercent: 0,
                    hundredPercent: 0,
                },
            });
        });
    });

    describe('changeLockRoom', () => {
        it('should toggle the lock state of the room', () => {
            const room: Room = { id: 'room123', isLocked: false } as Room;

            gameServiceRoom.changeLockRoom(room);

            expect(room.isLocked).toBe(true);
        });
    });

    it('should return false if the specified room is not found in the list', () => {
        listRooms = [];

        const room: Room = { id: 'room123', isTesting: false } as Room;

        const result = gameServiceRoom.deleteRoom(room, listRooms);

        expect(result).toBe(false);
        expect(listRooms.length).toBe(0);
        expect(gameConnectionGatewayMock.sendRoomState).not.toHaveBeenCalled();
    });
    it('should return a room object without nameBanned, isLocked, and timer properties', () => {
        const result = gameServiceRoom.prepareRoomForResponse(createRoomDto);

        expect(result.nameBanned).toBeUndefined();
        expect(result.timer).toBeUndefined();

        expect(result.id).toBe(createRoomDto.id);
        expect(result.accessCode).toBe(createRoomDto.accessCode);
    });
    it('should add player name to nameBanned list and call banPlayerFromRoom on gameConnectionGateway', () => {
        gameServiceRoom.banPlayerFromRoom(createRoomDto.listPlayers[0], createRoomDto);

        expect(createRoomDto.nameBanned.includes(createRoomDto.listPlayers[0].name)).toBe(true);
        expect(gameConnectionGatewayMock.banPlayerFromRoom).toHaveBeenCalledWith(createRoomDto.id, createRoomDto.listPlayers[0].name);
    });
});
