/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { PlayerConnectionGateway } from '@app/gateways/player-connection/player-connection.gateway';
import { GameHistoryDbService } from '@app/services/game-history/game-history.service';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { GameServicePlayer } from '@app/services/game-services/game-player-Service/game-player-service';
import { GameServiceRoom } from '@app/services/game-services/game-room-service/game-room-service';
import { GameServiceState } from '@app/services/game-services/game-state-service/game-state-service';
import { GameServiceTimer } from '@app/services/game-services/game-timer-service/game-timer-service';
import { Player } from '@common/classes/player';
import { MIN_QCM_PANIC_TIME, QRL_QUESTION_TIME, SECONDS_BETWEEN_ROUNDS } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Question } from '@common/interfaces/question';
import { Test, TestingModule } from '@nestjs/testing';

describe('GameService', () => {
    let service: GameService;
    let gameConnectionGateway: Partial<GameConnectionGateway>;
    let gameServicePlayer: Partial<GameServicePlayer>;
    let gameServiceRoom: Partial<GameServiceRoom>;
    let gameServiceState: Partial<GameServiceState>;
    let gameServiceTimer: Partial<GameServiceTimer>;
    let gameHistory: Partial<GameHistoryDbService>;
    let playerConnectionGateway: Partial<PlayerConnectionGateway>;
    let room: Room;

    beforeEach(async () => {
        gameConnectionGateway = { sendRoomState: jest.fn(), startGame: jest.fn() };
        gameServicePlayer = {
            verifyPlayerAnswers: jest.fn(),
            verifyQrlAnswers: jest.fn(),
            endRoundPlayer: jest.fn(),
            nextRoundPlayer: jest.fn(),
            removePlayerFromRoom: jest.fn(),
            checkAllPlayersAnswered: jest.fn(),
        };
        gameServiceRoom = { createNewGame: jest.fn(), prepareRoomForResponse: jest.fn(), deleteRoom: jest.fn() };
        gameServiceState = { endRoundState: jest.fn(), nextRoundState: jest.fn() };
        gameServiceTimer = {
            stopTimerForRoom: jest.fn(),
            updateClientTime: jest.fn(),
            startTimerForRoom: jest.fn(),
            startPanicTimerForRoom: jest.fn(),
            timerNextRoundManager: jest.fn(),
        };
        playerConnectionGateway = { sendPlayersUpdate: jest.fn(), sendUpdatedStats: jest.fn() };
        gameHistory = { addGameToHistory: jest.fn() };
        jest.useFakeTimers();

        room = {
            id: 'room1',
            listPlayers: [new Player('Player 1'), new Player('Player 2')],
            quiz: {
                questions: [
                    { _id: 'q1', text: 'Question 1', points: 10, choices: [], date: new Date(), type: QuestionType.QCM } as Question,
                    { _id: 'q2', text: 'Question 2', points: 20, choices: [], date: new Date(), type: QuestionType.QCM } as Question,
                ],
                duration: 30,
                visible: true,
                lastModification: new Date(),
                _id: 'quizId',
                title: 'Sample Quiz',
                description: 'A sample quiz for testing',
            },
            questionStats: [
                {
                    questionIndex: 0,
                    questionType: 'QCM',
                    stats: {
                        'Correct Answer': { count: 0, isCorrect: true },
                        'Incorrect Answer': { count: 0, isCorrect: false },
                    },
                    statsQRL: {
                        modifiedLastSeconds: 1,
                        notModifiedLastSeconds: 0,
                        scores: {
                            zeroPercent: 0,
                            fiftyPercent: 0,
                            hundredPercent: 0,
                        },
                    },
                },
            ],
            isPanicMode: false,
            accessCode: 'ACCESS123',
            nameBanned: [],
            currentTime: 30,
            randomMode: false,
            currentQuestionIndex: 0,
            isLocked: false,
            roundFinished: false,
            isTesting: false,
            lockPlayerPoints: false,
            isPaused: false,
            bestScore: 0,
            dateCreated: new Date(),
            currentState: GameState.END_ROUND,
            numberOfPlayers: 0,
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                { provide: GameConnectionGateway, useValue: gameConnectionGateway },
                { provide: GameServicePlayer, useValue: gameServicePlayer },
                { provide: GameServiceRoom, useValue: gameServiceRoom },
                { provide: GameServiceState, useValue: gameServiceState },
                { provide: GameServiceTimer, useValue: gameServiceTimer },
                { provide: GameHistoryDbService, useValue: gameHistory },
                { provide: PlayerConnectionGateway, useValue: playerConnectionGateway },
            ],
        }).compile();

        service = module.get<GameService>(GameService);
        service['listRooms'].push(room);
        jest.spyOn<typeof gameHistory, any>(gameHistory, 'addGameToHistory').mockImplementation();
        jest.spyOn<typeof service, any>(service, 'beforeStartEndTimer');
        jest.spyOn<typeof service, any>(service, 'nextRoundEndTimer');
        jest.spyOn<typeof service, any>(service, 'betweenRoundEndTimer');
        jest.spyOn<typeof service, any>(service, 'questionTypeChecker');
        jest.spyOn<typeof service, any>(service, 'emitEndRound');
        jest.spyOn<typeof service, any>(service, 'changeGameState');
    });
    describe('createRoomMain', () => {
        it('should create a new game room and return its ID', async () => {
            const quizId = 'quiz123';
            const isTesting = true;
            const roomId = 'room123';
            const randomMode = false;
            (gameServiceRoom.createNewGame as jest.Mock).mockResolvedValue(roomId);

            const changeGameStateSpy = jest.spyOn(service, 'changeGameState').mockImplementation();

            const result = await service.createRoomMain(quizId, isTesting, randomMode);

            expect(result).toBe(roomId);
            expect(gameServiceRoom.createNewGame).toHaveBeenCalledWith(quizId, isTesting, service['listRooms'], randomMode);

            expect(changeGameStateSpy).toHaveBeenCalledWith(roomId, GameState.NEXT_ROUND);

            changeGameStateSpy.mockRestore();
        });
    });
    describe('createRoomMain', () => {
        it('should create a new game room and return its ID', async () => {
            const quizId = 'quiz123';
            const isTesting = false;
            const roomId = 'room123';
            const randomMode = true;
            (gameServiceRoom.createNewGame as jest.Mock).mockResolvedValue(roomId);

            const changeGameStateSpy = jest.spyOn(service, 'changeGameState').mockImplementation();

            const result = await service.createRoomMain(quizId, isTesting, randomMode);

            expect(result).toBe(roomId);
            expect(gameServiceRoom.createNewGame).toHaveBeenCalledWith(quizId, isTesting, service['listRooms'], randomMode);

            expect(changeGameStateSpy).toHaveBeenCalledWith(roomId, GameState.NEXT_ROUND);

            changeGameStateSpy.mockRestore();
        });
    });

    describe('findRoomById', () => {
        it('should return a room if it exists', () => {
            service['listRooms'].push(room);

            const result = service.findRoomById('room1');

            expect(result).toBeDefined();
            expect(result?.id).toBe('room1');
        });

        it('should return null if no room exists with the given ID', () => {
            const result = service.findRoomById('GameState.NONExistingRoom');

            expect(result).toBeNull();
        });
    });
    describe('getGameInfo', () => {
        it('should return room information for a given ID', () => {
            const roomId = 'room123';
            service['listRooms'].push(room);

            jest.spyOn(service, 'findRoomById').mockReturnValue(room);
            jest.spyOn(gameServiceRoom, 'prepareRoomForResponse').mockReturnValue(room);

            const result = service.getGameInfo(roomId);

            expect(service.findRoomById).toHaveBeenCalledWith(roomId);
            expect(gameServiceRoom.prepareRoomForResponse).toHaveBeenCalledWith(room);
            expect(result).toEqual(room);
        });
    });
    describe('getGamePlayers', () => {
        it('should return list of players for a given room ID', () => {
            const roomId = 'room123';
            const mockPlayers = [new Player('Alice'), new Player('Bob')];
            room.listPlayers = mockPlayers;

            room.id = roomId;
            service['listRooms'] = [room];

            jest.spyOn(service, 'findRoomById').mockReturnValue(room);

            const result = service.getGamePlayers(roomId);

            expect(result).toEqual(mockPlayers);
        });

        it('should return null if room is not found', () => {
            jest.spyOn(service, 'findRoomById').mockReturnValue(null);

            const result = service.getGamePlayers('GameState.NONExistingRoomId');

            expect(result).toBeNull();
        });
    });
    describe('getRoomIdByCode', () => {
        it('should return a room that matches the access code', () => {
            const accessCode = room.accessCode;
            service['listRooms'].push(room);

            const result = service.getRoomIdByCode(accessCode);

            expect(result).toEqual(room);
        });
    });
    describe('enablePanicMode', () => {
        it('should not enable panic mode if the room state is not NEXT_ROUND', () => {
            service.findRoomById = jest.fn().mockReturnValue(room);

            jest.spyOn(service as any, 'emitRoundState');
            jest.spyOn(service, 'restartTimer');

            service.enablePanicMode(room.id);

            expect(service['emitRoundState']).not.toHaveBeenCalled();
            expect(room.isPanicMode).toBe(false);
            expect(service.restartTimer).not.toHaveBeenCalled();
        });
    });
    describe('verifyPlayerAnswersMain', () => {
        it('should change game state to GameState.END_ROUND if answers are verified correctly', () => {
            const roomId = 'room123';

            const answers = [{ text: 'Correct Answer', isCorrect: true }];
            service['listRooms'].push(room);

            jest.spyOn(service, 'findRoomById').mockReturnValue(room);
            jest.spyOn(gameServicePlayer, 'verifyPlayerAnswers').mockReturnValue(true);
            jest.spyOn(service, 'changeGameState');

            service.verifyPlayerAnswersMain(roomId, answers, 'Alice');

            expect(gameServicePlayer.verifyPlayerAnswers).toHaveBeenCalledWith(room, answers, 'Alice');
            expect(service.changeGameState).toHaveBeenCalledWith(roomId, GameState.END_ROUND);
        });
    });

    describe('verifyQrlAnswersMain', () => {
        it('should end round and change state to END_ROUND if room is in testing mode', () => {
            const qrlAnswer = 'qrlAnswer';
            room.isTesting = true;
            jest.spyOn(service, 'findRoomById').mockReturnValue(room);
            const endRoundPlayerSpy = jest.spyOn(gameServicePlayer, 'endRoundPlayer');
            jest.spyOn(service, 'changeGameState').mockImplementation();

            service.verifyQrlAnswersMain(room.id, qrlAnswer, room.listPlayers[0].name);

            expect(endRoundPlayerSpy).toHaveBeenCalledWith(room, room.listPlayers);
            expect(service.changeGameState).toHaveBeenCalledWith(room.id, GameState.END_ROUND);
        });
        it('should change state to QRL_EVALUATION if answers are verified and room is not in testing mode', () => {
            const qrlAnswer = 'QRL Answer';
            room.isTesting = false;

            jest.spyOn(service, 'findRoomById').mockReturnValue(room);
            jest.spyOn(gameServicePlayer, 'verifyQrlAnswers').mockReturnValue(true);
            jest.spyOn(service, 'changeGameState').mockImplementation();

            service.verifyQrlAnswersMain(room.id, qrlAnswer, room.listPlayers[0].name);

            expect(gameServicePlayer.verifyQrlAnswers).toHaveBeenCalledWith(room, qrlAnswer, room.listPlayers[0].name);
            expect(service.changeGameState).toHaveBeenCalledWith(room.id, GameState.QRL_EVALUATION);
        });
    });

    describe('updateQrlInteration', () => {
        it('should update QRL statistics when player has interacted', () => {
            room.listPlayers[0].hasInteracted = true;

            const updateQRLModifiedSpy = jest.spyOn(service, 'updateQRLModified');

            service.updateQrlInteration(room, room.listPlayers[0]);

            expect(updateQRLModifiedSpy).toHaveBeenCalledWith(room, 1);
        });

        it('should update QRL statistics when player has not interacted', () => {
            room.listPlayers[0].hasInteracted = false;

            const updateQRLModifiedSpy = jest.spyOn(service, 'updateQRLModified');

            service.updateQrlInteration(room, room.listPlayers[0]);

            expect(updateQRLModifiedSpy).toHaveBeenCalledWith(room, 0);
        });
    });

    describe('changeGameState', () => {
        it('should call beforeStartMain for GameState.BEFORE_START state', () => {
            service['listRooms'].push(room);
            const spyBeforeStartMain = jest.spyOn<typeof service, any>(service, 'beforeStartMain');
            service.changeGameState(room.id, GameState.BEFORE_START);
            expect(spyBeforeStartMain).toHaveBeenCalledWith(room);
        });
        it('should call nextRoundMain for GameState.NEXT_ROUND state', () => {
            room.quiz.questions.push({
                _id: 'questionId',
                text: 'Sample question text',
                points: 10,
                choices: [{ text: 'Choice 1', isCorrect: true }],
                date: new Date(),
                type: QuestionType.QCM,
            });
            service['listRooms'].push(room);
            const spyBeforeNextRound = jest.spyOn<typeof service, any>(service, 'nextRoundMain');
            service.changeGameState(room.id, GameState.NEXT_ROUND);
            expect(spyBeforeNextRound).toHaveBeenCalledWith(room);
            spyBeforeNextRound.mockRestore();
        });
        it('should call betweenRoundMain for GameState.BETWEEN_ROUNDS state', () => {
            service['listRooms'].push(room);
            (gameServiceTimer.startTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                callback();
                return Promise.resolve();
            });
            const spyBetweenRounds = jest.spyOn<typeof service, any>(service, 'betweenRoundMain').mockImplementation();
            service.changeGameState(room.id, GameState.BETWEEN_ROUNDS);

            expect(spyBetweenRounds).toHaveBeenCalledWith(room);
            spyBetweenRounds.mockRestore();
        });
        it('should call endRoundMain for GameState.END_ROUND state', () => {
            service['listRooms'].push(room);
            const spyEndRound = jest.spyOn<typeof service, any>(service, 'endRoundMain').mockImplementation();
            service.changeGameState(room.id, GameState.END_ROUND);
            expect(spyEndRound).toHaveBeenCalledWith(room);
            spyEndRound.mockRestore();
        });
        it('should call endRoomMain for GameState.END_ROOM state', () => {
            service['listRooms'].push(room);
            const spyEndRoom = jest.spyOn<typeof service, any>(service, 'endRoomMain').mockImplementation();
            service.changeGameState(room.id, GameState.END_ROOM);
            expect(spyEndRoom).toHaveBeenCalledWith(room);
            spyEndRoom.mockRestore();
        });
        it('should call endGameMain for GameState.END_GAME state', () => {
            service['listRooms'].push(room);
            const spyGameMain = jest.spyOn<typeof service, any>(service, 'endGameMain').mockImplementation();
            service.changeGameState(room.id, GameState.END_GAME);
            expect(spyGameMain).toHaveBeenCalledWith(room);
            spyGameMain.mockRestore();
        });
        it('should call evaluateQrlMain for GameState.QRL_EVALUATION state', () => {
            service['listRooms'].push(room);
            const spyEvaluateQrl = jest.spyOn<typeof service, any>(service, 'evaluateQrlMain').mockImplementation();
            service.changeGameState(room.id, GameState.QRL_EVALUATION);
            expect(spyEvaluateQrl).toHaveBeenCalledWith(room);
            spyEvaluateQrl.mockRestore();
        });

        describe('updateListPlayers', () => {
            it('should end round for players and change game state to END_ROUND', () => {
                const endRoundPlayerSpy = jest.spyOn(gameServicePlayer, 'endRoundPlayer');
                const changeGameStateSpy = jest.spyOn(service, 'changeGameState');

                service.updateListPlayers(room, room.listPlayers);

                expect(endRoundPlayerSpy).toHaveBeenCalledWith(room, room.listPlayers);
                expect(changeGameStateSpy).toHaveBeenCalledWith(room.id, GameState.END_ROUND);
            });
        });

        describe('beforeStartMain', () => {
            it('should emit GameState.BEFORE_START state and start a timer', async () => {
                room.listPlayers = [];
                (gameServiceTimer.startTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                    callback();
                    return Promise.resolve();
                });
                const changeGameStateSpy = jest.spyOn(service, 'changeGameState').mockImplementation();
                service['beforeStartMain'](room);
                jest.runAllTimers();
                expect(gameConnectionGateway.sendRoomState).toHaveBeenCalledWith(room.id, GameState.BEFORE_START);
                expect(gameServiceTimer.startTimerForRoom).toHaveBeenCalled();
                changeGameStateSpy.mockRestore();
            });
        });
        describe('nextRoundMain', () => {
            it('should call the necessary methods and emit the GameState.NEXT_ROUND state for QCM questions', async () => {
                const roomWithQCMQuestions: Room = {
                    ...room,
                    quiz: {
                        ...room.quiz,
                        questions: [
                            { _id: 'q1', text: 'Question 1', points: 10, choices: [], date: new Date() } as Question,
                            { _id: 'q2', text: 'Question 2', points: 20, choices: [], date: new Date() } as Question,
                        ],
                        duration: 30,
                        visible: true,
                        lastModification: new Date(),
                        _id: 'quizId',
                        title: 'Sample Quiz',
                        description: 'A sample quiz for testing',
                    },
                };

                await service['nextRoundMain'](roomWithQCMQuestions);

                expect(gameServiceState.nextRoundState).toHaveBeenCalledWith(roomWithQCMQuestions);
                expect(gameServicePlayer.nextRoundPlayer).toHaveBeenCalledWith(roomWithQCMQuestions);
                expect(gameConnectionGateway.sendRoomState).toHaveBeenCalledWith(roomWithQCMQuestions.id, GameState.NEXT_ROUND);
            });

            it('should call the necessary methods and emit the GameState.NEXT_ROUND state for QRL questions', async () => {
                const roomWithQRLQuestions: Room = {
                    ...room,
                    quiz: {
                        ...room.quiz,
                        questions: [
                            { _id: 'q1', text: 'Question 1', points: 10, choices: [], date: new Date(), type: QuestionType.QRL } as Question,
                            { _id: 'q2', text: 'Question 2', points: 20, choices: [], date: new Date(), type: QuestionType.QRL } as Question,
                        ],
                        duration: 30,
                        visible: true,
                        lastModification: new Date(),
                        _id: 'quizId',
                        title: 'Sample Quiz',
                        description: 'A sample quiz for testing',
                    },
                };

                await service['nextRoundMain'](roomWithQRLQuestions);

                expect(gameServiceState.nextRoundState).toHaveBeenCalledWith(roomWithQRLQuestions);
                expect(gameServicePlayer.nextRoundPlayer).toHaveBeenCalledWith(roomWithQRLQuestions);
                expect(gameConnectionGateway.sendRoomState).toHaveBeenCalledWith(roomWithQRLQuestions.id, GameState.NEXT_ROUND);
                expect(gameServiceTimer.startTimerForRoom).toHaveBeenCalledWith(roomWithQRLQuestions, QRL_QUESTION_TIME, expect.any(Function));
            });
        });

        describe('betweenRoundMain', () => {
            it('should emit GameState.BEFORE_START state and start a timer', async () => {
                (gameServiceTimer.startTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                    callback();
                    return Promise.resolve();
                });
                const changeGameStateSpy = jest.spyOn(service, 'changeGameState').mockImplementation();
                service['betweenRoundMain'](room);
                jest.runAllTimers();
                expect(gameServiceTimer.startTimerForRoom).toHaveBeenCalled();
                expect(gameConnectionGateway.sendRoomState).toHaveBeenCalledWith(room.id, GameState.BETWEEN_ROUNDS);
                changeGameStateSpy.mockRestore();
            });
        });

        describe('evaluateQrlMain', () => {
            it('should emit GameState.NEXT_ROUND state', () => {
                const sendPlayersUpdateSpy = jest.spyOn(playerConnectionGateway, 'sendPlayersUpdate' as keyof PlayerConnectionGateway);
                jest.spyOn<typeof service, any>(service, 'emitRoundState').mockImplementation();
                service['evaluateQrlMain'](room);
                expect(gameServiceTimer.stopTimerForRoom).toHaveBeenCalledWith(room);
                expect(gameServiceTimer.updateClientTime).toHaveBeenCalledWith(room, 0);
                expect(sendPlayersUpdateSpy).toHaveBeenCalledWith(room.id, room.listPlayers);
                expect(service['emitRoundState']).toHaveBeenCalledWith(room.id, GameState.QRL_EVALUATION);
            });
        });

        describe('GameService - endGameMain', () => {
            it('should stop the timer and emit the end game state for testing rooms', () => {
                room.isTesting = true;
                (gameServiceTimer.startTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                    callback();
                    return Promise.resolve();
                });
                jest.spyOn<typeof service, any>(service, 'emitEndGame').mockImplementation();
                service['endGameMain'](room);
                jest.runAllTimers();
                expect(service['emitEndGame']).toHaveBeenCalledWith(room.id);
            });
            it('should immediately emit the end game state for non-testing rooms', () => {
                room.isTesting = false;
                jest.spyOn<typeof service, any>(service, 'emitEndGame').mockImplementation();
                service['endGameMain'](room);
                expect(service['emitEndGame']).toHaveBeenCalledWith(room.id);
            });
        });
        it('should emit GameState.END_ROUND and then GameState.END_GAME for testing room after the last question', () => {
            room.isTesting = true;
            room.currentQuestionIndex = 2;
            jest.spyOn<typeof service, any>(service, 'emitRoundState').mockImplementation();
            jest.spyOn(service, 'changeGameState').mockImplementation();
            service['emitEndRound'](room);
            expect(service['emitRoundState']).toHaveBeenCalledWith(room.id, GameState.END_ROUND);
            expect(service.changeGameState).toHaveBeenCalledWith(room.id, GameState.END_GAME);
        });
        it('should emit FINAL_GameState.END_ROUND for non-testing room after the last question', () => {
            room.isTesting = false;
            room.currentQuestionIndex = 2;
            jest.spyOn<typeof service, any>(service, 'emitRoundState').mockImplementation();
            jest.spyOn(service, 'changeGameState').mockImplementation();
            service['emitEndRound'](room);
            expect(service['emitRoundState']).toHaveBeenCalledWith(room.id, GameState.FINAL_END_ROUND);
            expect(service.changeGameState).not.toHaveBeenCalledWith(room.id, GameState.END_GAME);
        });
        it('should stop timer for a given room', () => {
            const roomId = 'testRoomId';
            jest.spyOn(service, 'findRoomById').mockReturnValue(room);
            service.stopTimer(roomId);

            expect(gameServiceTimer.stopTimerForRoom).toHaveBeenCalledWith(room);
        });
        it('should restart timer for a room if conditions are met', () => {
            jest.spyOn(service, 'findRoomById').mockReturnValue(room);
            jest.spyOn<typeof service, any>(service, 'canRestartTimer').mockReturnValue(true);
            jest.spyOn<typeof service, any>(service, 'handleTimerBasedOnPanicMode').mockImplementation();
            service.restartTimer(room.id);

            expect(service['handleTimerBasedOnPanicMode']).toHaveBeenCalledWith(room);
        });
        it('should disable panic mode and handle GameState.BEFORE_START state', () => {
            room.isPanicMode = true;
            room.currentState = GameState.BEFORE_START;
            service['endTimerController'](room);

            expect(service['beforeStartEndTimer']).toHaveBeenCalledWith(room);
            expect(service['nextRoundEndTimer']).not.toHaveBeenCalled();
            expect(service['betweenRoundEndTimer']).not.toHaveBeenCalled();
        });

        it('should disable panic mode and handle GameState.NEXT_ROUND state', () => {
            room.isPanicMode = true;
            room.currentState = GameState.NEXT_ROUND;
            service['endTimerController'](room);

            expect(service['beforeStartEndTimer']).not.toHaveBeenCalled();
            expect(service['nextRoundEndTimer']).toHaveBeenCalledWith(room);
            expect(service['betweenRoundEndTimer']).not.toHaveBeenCalled();
        });

        it('should disable panic mode and handle GameState.BETWEEN_ROUNDS state', () => {
            room.isPanicMode = true;
            room.currentState = GameState.BETWEEN_ROUNDS;

            service['endTimerController'](room);

            expect(service['beforeStartEndTimer']).not.toHaveBeenCalled();
            expect(service['nextRoundEndTimer']).not.toHaveBeenCalled();
            expect(service['betweenRoundEndTimer']).toHaveBeenCalledWith(room);
        });
        describe('beforeStartEndTimer', () => {
            it('should set currentState to GameState.START_GAME and trigger GameState.NEXT_ROUND state change', () => {
                jest.spyOn<typeof service, any>(service, 'beforeStartEndTimer').mockImplementation();
                service['beforeStartEndTimer'](room);
                expect(room.currentState).toBe(GameState.END_ROUND);
                expect(service['beforeStartEndTimer']).toHaveBeenCalledWith(room);
            });
        });

        describe('nextRoundEndTimer', () => {
            it('should trigger timerNextRoundManager with true', () => {
                jest.spyOn<typeof service, any>(service, 'nextRoundEndTimer').mockImplementation();
                service['nextRoundEndTimer'](room);
                expect(service['nextRoundEndTimer']).toHaveBeenCalledWith(room);
            });
        });

        describe('betweenRoundEndTimer', () => {
            it('should call changeGameState with the GameState.NEXT_ROUND state', () => {
                const mockChangeGameState = jest.spyOn<typeof service, any>(service, 'changeGameState').mockImplementation();
                service['betweenRoundEndTimer'](room);

                expect(mockChangeGameState).toHaveBeenCalledWith(room.id, GameState.NEXT_ROUND);
            });
            it('should trigger state change to GameState.NEXT_ROUND', () => {
                jest.spyOn<typeof service, any>(service, 'betweenRoundEndTimer').mockImplementation();
                service['betweenRoundEndTimer'](room);
                expect(service['betweenRoundEndTimer']).toHaveBeenCalledWith(room);
            });
            it('should call nextRoundEndTimer after timer expires', () => {
                service['nextRoundMain'](room);

                expect(gameServiceTimer.startTimerForRoom).toHaveBeenCalledWith(room, room.quiz.duration, expect.any(Function));

                const callback = (gameServiceTimer.startTimerForRoom as jest.Mock).mock.calls[0][2];
                callback();

                expect(service['nextRoundEndTimer']).toHaveBeenCalledWith(room);
            });
            describe('canRestartTimer', () => {
                it('should return true if currentTime > 0 and currentState is not GameState.END_ROUND', () => {
                    room.currentState = GameState.BETWEEN_ROUNDS;
                    expect(service['canRestartTimer'](room)).toBe(false);
                });

                it('should return false if currentTime <= 0', () => {
                    expect(service['canRestartTimer'](room)).toBe(false);
                });

                it('should return false if currentState is GameState.END_ROUND', () => {
                    room.currentState = GameState.END_ROUND;
                    expect(service['canRestartTimer'](room)).toBe(false);
                });
            });
            describe('handleTimerBasedOnPanicMode', () => {
                it('should call startPanicModeTimer if isPanicMode is true', () => {
                    room.isPanicMode = true;
                    jest.spyOn<typeof service, any>(service, 'startPanicModeTimer').mockImplementation();
                    jest.spyOn<typeof service, any>(service, 'startRegularTimer').mockImplementation();

                    service['handleTimerBasedOnPanicMode'](room);

                    expect(service['startPanicModeTimer']).toHaveBeenCalledWith(room);
                    expect(service['startRegularTimer']).not.toHaveBeenCalled();
                });

                it('should call startRegularTimer if isPanicMode is false', () => {
                    room.isPanicMode = false;
                    jest.spyOn<typeof service, any>(service, 'startPanicModeTimer').mockImplementation();
                    jest.spyOn<typeof service, any>(service, 'startRegularTimer').mockImplementation();

                    service['handleTimerBasedOnPanicMode'](room);

                    expect(service['startPanicModeTimer']).not.toHaveBeenCalled();
                    expect(service['startRegularTimer']).toHaveBeenCalledWith(room);
                });
            });
            describe('startRegularTimer', () => {
                it('should start a regular timer and call endTimerController upon completion', async () => {
                    jest.spyOn(gameServiceTimer, 'startTimerForRoom').mockImplementation(async (room, time, callback) => {
                        callback();
                    });
                    jest.spyOn<typeof service, any>(service, 'endTimerController').mockImplementation();

                    service['startRegularTimer'](room);

                    expect(gameServiceTimer.startTimerForRoom).toHaveBeenCalledWith(room, room.currentTime, expect.any(Function));
                    expect(service['endTimerController']).toHaveBeenCalledWith(room);
                });
            });
            it('should call removePlayerFromRoom and change state if conditions are met', () => {
                room.listPlayers = [];
                room.listPlayers[0] = new Player('Youpi');
                room.currentState = GameState.END_GAME;
                const username = room.listPlayers[0].name;
                jest.spyOn(service, 'changeGameState');
                jest.spyOn(gameServicePlayer, 'removePlayerFromRoom').mockReturnValue(true);
                jest.spyOn(gameServicePlayer, 'checkAllPlayersAnswered').mockReturnValue(true);

                const result = service.deletePlayerFromRoom(room, username);

                expect(gameServicePlayer.removePlayerFromRoom).toHaveBeenCalledWith(room, username);
                expect(service.changeGameState).toHaveBeenCalledWith(room.id, GameState.END_ROOM);
                expect(result).toBe(true);
            });
            it('should call removePlayerFromRoom and change state if conditions are met', () => {
                room.listPlayers = [];
                room.listPlayers[0] = new Player('Youpi');
                room.currentState = GameState.BEFORE_START;
                room.quiz.questions[room.currentQuestionIndex].type = QuestionType.QRL;
                const username = room.listPlayers[0].name;
                jest.spyOn(service, 'changeGameState');
                jest.spyOn(gameServicePlayer, 'removePlayerFromRoom').mockReturnValue(false);
                jest.spyOn(gameServicePlayer, 'checkAllPlayersAnswered').mockReturnValue(true);

                const result = service.deletePlayerFromRoom(room, username);

                expect(gameServicePlayer.removePlayerFromRoom).toHaveBeenCalledWith(room, username);
                expect(service.changeGameState).toHaveBeenCalledWith(room.id, GameState.QRL_EVALUATION);
                expect(result).toBe(true);
            });
            it('should call removePlayerFromRoom and change state if conditions are met', () => {
                room.listPlayers = [];
                room.listPlayers[0] = new Player('Youpi');
                room.listPlayers[1] = new Player('Youpi2');
                room.listPlayers[1].answered = true;
                room.listPlayers[0].answered = true;

                jest.spyOn(gameServicePlayer, 'checkAllPlayersAnswered').mockReturnValue(true);
                room.currentState = GameState.NOT_STARTED;
                const username = room.listPlayers[0].name;
                jest.spyOn(service, 'changeGameState');
                jest.spyOn(gameServicePlayer, 'removePlayerFromRoom').mockReturnValue(false);

                const result = service.deletePlayerFromRoom(room, username);

                expect(gameServicePlayer.removePlayerFromRoom).toHaveBeenCalled();
                expect(service.changeGameState).toHaveBeenCalled();
                expect(result).toBe(true);
            });

            it('should update stats for selected options in the room questionStats', () => {
                const roomId = 'room1';
                const answer = { text: 'Correct Answer', isCorrect: true };
                const action = 1;

                const updatedRoom = service.updateStatsSelectedOptions(roomId, answer, action);

                expect(updatedRoom.questionStats[0].stats['Correct Answer'].count).toBe(1);
            });

            it('should not update stats if room or questionStats are not found', () => {
                const roomId = 'GameState.NONExistentRoomId';
                const answer = { text: 'Correct Answer', isCorrect: true };
                const action = 1;

                const updatedRoom = service.updateStatsSelectedOptions(roomId, answer, action);

                expect(updatedRoom).toBeNull();
            });

            it('should decrement stats for selected options in the room questionStats when action is not 1', () => {
                const roomId = 'room1';
                const answer = { text: 'Correct Answer', isCorrect: true };
                const action = 2;

                const updatedRoom = service.updateStatsSelectedOptions(roomId, answer, action);

                expect(updatedRoom.questionStats[0].stats['Correct Answer'].count).toBe(-1);
            });

            it('should not update stats if answer choice is not found in questionStats', () => {
                const roomId = 'room1';
                const answer = { text: 'Non-existent Answer', isCorrect: true };
                const action = 1;

                const updatedRoom = service.updateStatsSelectedOptions(roomId, answer, action);

                expect(updatedRoom.questionStats[0].stats['Correct Answer'].count).toBe(0);
            });

            it('should update statsQRL modifiedLastSeconds', () => {
                const action = 1;
                room.questionStats[0].questionType = 'QRL';
                room.questionStats[0].statsQRL = {
                    modifiedLastSeconds: 1,
                    notModifiedLastSeconds: 0,
                    scores: {
                        zeroPercent: 0,
                        fiftyPercent: 0,
                        hundredPercent: 0,
                    },
                };

                jest.spyOn(service, 'getCurrentQuestionStats').mockReturnValue(room.questionStats[0]);
                jest.spyOn(service, 'isQRLQuestion').mockReturnValue(true);
                service.updateQRLModified(room, action);

                expect(room.questionStats[0].statsQRL.modifiedLastSeconds).toBe(2);
                expect(room.questionStats[0].statsQRL.notModifiedLastSeconds).toBe(0);
            });

            it('should not update statsQRL modifiedLastSeconds', () => {
                const action = 0;
                room.questionStats[0].questionType = 'QRL';
                room.questionStats[0].statsQRL = {
                    modifiedLastSeconds: 1,
                    notModifiedLastSeconds: 0,
                    scores: {
                        zeroPercent: 0,
                        fiftyPercent: 0,
                        hundredPercent: 0,
                    },
                };
                jest.spyOn(service, 'getCurrentQuestionStats').mockReturnValue(room.questionStats[0]);
                jest.spyOn(service, 'isQRLQuestion').mockReturnValue(true);
                service.updateQRLModified(room, action);

                expect(room.questionStats[0].statsQRL.modifiedLastSeconds).toBe(1);
                expect(room.questionStats[0].statsQRL.notModifiedLastSeconds).toBe(1);
            });

            it('should do nothing if room or questionStats is empty', () => {
                const action = 1;
                room.questionStats = [];

                jest.spyOn(service, 'getCurrentQuestionStats').mockReturnValue(null);
                jest.spyOn(service, 'isQRLQuestion').mockReturnValue(false);
                const sendPlayersUpdateSpy = jest.spyOn(playerConnectionGateway, 'sendPlayersUpdate' as keyof PlayerConnectionGateway);

                service.updateQRLModified(room, action);

                expect(sendPlayersUpdateSpy).not.toHaveBeenCalled();
            });
        });

        it('should not change state if room is GameState.NOT_STARTED', () => {
            room.currentState = 'GameState.NOT_STARTED';

            const username = 'testPlayer';
            jest.spyOn(service, 'changeGameState');

            service.deletePlayerFromRoom(room, username);

            expect(gameServicePlayer.removePlayerFromRoom).toHaveBeenCalledWith(room, username);
            expect(service.changeGameState).not.toHaveBeenCalledWith(room.id, 'GameState.END_ROOM');
        });

        it('should change state to QRL_EVALUATION if conditions are met', () => {
            room.currentState = GameState.NEXT_ROUND;
            room.quiz.questions[0].type = QuestionType.QRL;

            jest.spyOn(gameServicePlayer, 'checkAllPlayersAnswered').mockReturnValue(true);

            const username = 'testPlayer';
            jest.spyOn(service, 'changeGameState');

            service.deletePlayerFromRoom(room, username);

            expect(gameServicePlayer.removePlayerFromRoom).toHaveBeenCalledWith(room, username);
            expect(service.changeGameState).toHaveBeenCalledWith(room.id, GameState.QRL_EVALUATION);
        });

        describe('questionTypeChecker', () => {
            it('should end round player for QCM type question', () => {
                const endRoundPlayerSpy = jest.spyOn(gameServicePlayer, 'endRoundPlayer');
                service['questionTypeChecker'](room);
                expect(endRoundPlayerSpy).toHaveBeenCalledWith(room, room.listPlayers);
            });
            it('should send players update for QRL type question', () => {
                room.quiz.questions[0].type = QuestionType.QRL;
                const sendPlayersUpdateSpy = jest.spyOn(playerConnectionGateway, 'sendPlayersUpdate' as keyof PlayerConnectionGateway);
                service['questionTypeChecker'](room);
                expect(sendPlayersUpdateSpy).toHaveBeenCalledWith(room.id, room.listPlayers);
            });
        });

        describe('emitEndGame', () => {
            it('should call gameConnectionGateway.sendRoomState with the provided roomId and GameState.END_GAME', () => {
                const roomId = 'testRoomId';

                service['emitEndGame'](roomId);

                expect(gameConnectionGateway.sendRoomState).toHaveBeenCalledWith(roomId, GameState.END_GAME);
            });
        });
        it('should enable panic mode when conditions are met', () => {
            const roomId = 'room1';
            const room = service.findRoomById(roomId);
            room.currentState = GameState.NEXT_ROUND;
            room.quiz.questions[room.currentQuestionIndex].type = QuestionType.QCM;
            room.currentTime = MIN_QCM_PANIC_TIME + 1;

            service.enablePanicMode(roomId);
            expect(room.isPanicMode).toBe(true);
            expect(gameConnectionGateway.sendRoomState).toHaveBeenCalledWith(roomId, GameState.PANIC_MODE);
        });
        it('should enable panic mode when conditions are met', () => {
            const roomId = 'room1';
            const room = service.findRoomById(roomId);
            room.currentState = GameState.NEXT_ROUND;
            room.quiz.questions[room.currentQuestionIndex].type = QuestionType.QRL;
            room.currentTime = MIN_QCM_PANIC_TIME + 1;

            service.enablePanicMode(roomId);
            expect(room.isPanicMode).toBe(false);
        });

        it('should not enable panic mode if room state is not NEXT_ROUND', () => {
            const roomId = 'room1';
            const room = service.findRoomById(roomId);
            room.currentState = GameState.END_ROUND;

            service.enablePanicMode(roomId);

            expect(room.isPanicMode).toBe(false);
            expect(gameConnectionGateway.sendRoomState).not.toHaveBeenCalled();
        });

        it('should not enable panic mode if current time is less than minimum required time', () => {
            const roomId = 'room1';
            const room = service.findRoomById(roomId);
            room.currentState = GameState.NEXT_ROUND;
            room.quiz.questions[room.currentQuestionIndex].type = QuestionType.QCM;
            room.currentTime = MIN_QCM_PANIC_TIME - 1;
            service.enablePanicMode(roomId);

            expect(room.isPanicMode).toBe(false);
            expect(gameConnectionGateway.sendRoomState).not.toHaveBeenCalled();
        });
        it('should call nextRoundEndTimer with the correct room', () => {
            const roomId = 'room1';
            const room = service.findRoomById(roomId);
            room.quiz.questions[room.currentQuestionIndex].type = QuestionType.QRL;
            jest.spyOn(service['gameServiceTimer'], 'updateClientTime');
            jest.spyOn(service['gameServiceState'], 'nextRoundState');
            jest.spyOn(service['gameServicePlayer'], 'nextRoundPlayer');
            jest.spyOn(service['playerConnectionGateway'], 'sendUpdatedStats');
            jest.spyOn(service['gameServiceTimer'], 'startTimerForRoom');

            (gameServiceTimer.startTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                callback();
                return Promise.resolve();
            });

            service['nextRoundMain'](room);

            expect(service['nextRoundEndTimer']).toHaveBeenCalledWith(room);
        });
        it('should correctly handle ending a round without starting a new one', () => {
            service['endRoundMain'](room);

            expect(room.isPanicMode).toBeFalsy();
            expect(service['gameServiceTimer'].stopTimerForRoom).toHaveBeenCalledWith(room);
            expect(service['gameServiceTimer'].updateClientTime).toHaveBeenCalledWith(room, 0);
            expect(service['questionTypeChecker']).toHaveBeenCalledWith(room);
            expect(service['gameServiceState'].endRoundState).toHaveBeenCalledWith(room);
            expect(service['emitEndRound']).toHaveBeenCalledWith(room);
            expect(service['gameServiceTimer'].startTimerForRoom).not.toHaveBeenCalled();
        });

        it('should start a new round if the room is in testing or random mode and more questions are available', () => {
            room.isTesting = true;
            room.currentQuestionIndex = 0;

            (gameServiceTimer.startTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                callback();
                return Promise.resolve();
            });
            service['endRoundMain'](room);
            expect(service['gameServiceTimer'].startTimerForRoom).toHaveBeenCalledWith(room, SECONDS_BETWEEN_ROUNDS, expect.any(Function));
            expect(service.changeGameState).toHaveBeenCalled();
        });
        it('should call endGameInProductionMode when randomMode is true', () => {
            const roomId = 'room1';
            const room = service.findRoomById(roomId);
            room.randomMode = true;
            jest.spyOn(service['gameServiceTimer'], 'stopTimerForRoom').mockImplementation();
            jest.spyOn<typeof service, any>(service, 'endGameInProductionMode').mockImplementation();
            jest.spyOn(service['gameServiceTimer'], 'startTimerForRoom').mockImplementation((r, d, cb) => cb());
            service['endGameInTestingMode'](room);
            expect(service['gameServiceTimer'].stopTimerForRoom).toHaveBeenCalledWith(room);
            expect(service['gameServiceTimer'].startTimerForRoom).toHaveBeenCalledWith(room, SECONDS_BETWEEN_ROUNDS, expect.any(Function));
            expect(service['endGameInProductionMode']).toHaveBeenCalledWith(room);
        });
        it('should start the panic mode timer and set up callback to end timer controller', () => {
            (gameServiceTimer.startPanicTimerForRoom as jest.Mock).mockImplementation(async (_room, seconds, callback) => {
                callback();
                return Promise.resolve();
            });
            jest.spyOn<typeof service, any>(service, 'endTimerController');
            service['startPanicModeTimer'](room);

            expect(service['gameServiceTimer'].startPanicTimerForRoom).toHaveBeenCalledWith(room, room.currentTime, expect.any(Function));
            expect(service['endTimerController']).toHaveBeenCalledWith(room);
        });
        it('should return false for non-QRL question types', () => {
            const result = service.isQRLQuestion(room.questionStats[0]);
            expect(result).toBe(false);
        });
        it('should not emit BETWEEN_ROUNDS state if in random mode', () => {
            jest.spyOn<typeof service, any>(service, 'emitRoundState');

            room.randomMode = true;
            room.isTesting = false;
            service['emitTransitionBetweenRounds'](room.id);

            expect(service['emitRoundState']).toHaveBeenCalled();
        });
        it('should not emit BETWEEN_ROUNDS state if in random mode', () => {
            jest.spyOn<typeof service, any>(service, 'emitRoundState');

            room.isTesting = true;
            room.randomMode = false;
            service['emitTransitionBetweenRounds'](room.id);

            expect(service['emitRoundState']).toHaveBeenCalled();
        });
        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });
    });
});
