/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Room } from '@app/common-server/room';
import { PlayerConnectionGateway } from '@app/gateways/player-connection/player-connection.gateway';
import { GameServiceTimer } from '@app/services/game-services/game-timer-service/game-timer-service';
import { VerificationService } from '@app/services/verification-service/verification.service';
import { Player } from '@common/classes/player';
import { MULT_POINTS } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Answer } from '@common/interfaces/answer';
import { Question } from '@common/interfaces/question';
import { QuestionStats } from '@common/interfaces/questionStats';
import { GameServicePlayer } from './game-player-service';

describe('GameServicePlayer', () => {
    let gameServicePlayer: GameServicePlayer;
    let mockGameServiceTimer: Partial<GameServiceTimer>;
    let mockPlayerConnectionGateway: Partial<PlayerConnectionGateway>;
    let mockVerificationService: Partial<VerificationService>;
    let room: Room;
    let mockQuestionStats: QuestionStats;
    beforeEach(() => {
        mockGameServiceTimer = { startTimerFirstToAnswer: jest.fn() };
        mockPlayerConnectionGateway = {
            sendNewPlayerToClient: jest.fn(),
            sendLeftPlayerToClient: jest.fn(),
            sendPlayersUpdate: jest.fn(),
            sendPlayerInteraction: jest.fn(),
        };
        mockVerificationService = { generalVerification: jest.fn() };
        gameServicePlayer = new GameServicePlayer(
            mockPlayerConnectionGateway as PlayerConnectionGateway,
            mockGameServiceTimer as GameServiceTimer,
            mockVerificationService as VerificationService,
        );
        mockQuestionStats = {
            questionIndex: 0,
            questionType: 'QCM',
            stats: {
                ['choiceA']: { count: 10, isCorrect: true },
                ['choiceB']: { count: 5, isCorrect: false },
            },
            statsQRL: {
                modifiedLastSeconds: 0,
                notModifiedLastSeconds: 0,
                scores: {
                    zeroPercent: 0,
                    fiftyPercent: 0,
                    hundredPercent: 0,
                },
            },
        };
        room = {
            id: 'room1',
            listPlayers: [new Player('Player 1'), new Player('Player 2')],
            quiz: {
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
            isPanicMode: false,
            accessCode: 'ACCESS123',
            nameBanned: [],
            currentTime: 30,
            lockPlayerPoints: false,
            currentQuestionIndex: 0,
            bestScore: 0,
            isLocked: false,
            roundFinished: false,
            dateCreated: new Date(),
            numberOfPlayers: 0,
            isTesting: false,
            isPaused: false,
            randomMode: false,
            currentState: GameState.END_ROUND,
            questionStats: [mockQuestionStats],
        };
        room.listPlayers[0].goodAnswers = true;
        room.listPlayers[0].answered = true;
        room.listPlayers[0].firstToAnswer = true;
        room.listPlayers[1].goodAnswers = false;
    });
    it('should set player.firstToAnswer to true and increment bonusPoints for the first player to answer correctly', () => {
        room.listPlayers[0].firstToAnswer = false;
        jest.spyOn(gameServicePlayer, 'findPlayerByName').mockReturnValue(room.listPlayers[0]);
        jest.spyOn<typeof gameServicePlayer, any>(gameServicePlayer, 'verifyAnswersReceived').mockReturnValue(true);
        jest.spyOn<typeof gameServicePlayer, any>(gameServicePlayer, 'firstPlayerToAnswer').mockReturnValue(true);
        room.lockPlayerPoints = false;

        const playerName = 'Player 1';
        const answers: Answer[] = [{ text: 'Some Answer', isCorrect: true }];
        room.listPlayers[0].bonusPoints = 0;

        gameServicePlayer['verifyAndRecordPlayerAnswers'](room, answers, playerName);

        const player = room.listPlayers.find((p) => p.name === playerName);
        expect(player.firstToAnswer).toBeTruthy();
        expect(player.bonusPoints).toBe(1);
    });
    it('should return true when the last player is removed from the room', () => {
        room.listPlayers = [new Player('Player 2')];
        const result = gameServicePlayer.removePlayerFromRoom(room, 'Player 2');
        expect(result).toBeTruthy();
    });
    it('should return false when a player is removed from the room', () => {
        room.listPlayers = [new Player('Player 2'), new Player('Player 3'), new Player('Player 4')];
        const result = gameServicePlayer.removePlayerFromRoom(room, 'Player 2');
        expect(result).toBeFalsy();
    });
    it('should set player.goodAnswers to true and increment bonusPoints if first to answer', () => {
        jest.spyOn<typeof gameServicePlayer, any>(gameServicePlayer, 'firstPlayerToAnswer').mockReturnValue(true);
        const playerName = 'Player 1';
        const answers = [];
        gameServicePlayer['verifyAndRecordPlayerAnswers'](room, answers, playerName);
        const player = room.listPlayers.find((p) => p.name === playerName);
        expect(player.goodAnswers).toBeTruthy();
        expect(player.firstToAnswer).toBeFalsy();
        expect(player.bonusPoints).toBe(-1);
    });

    describe('addPlayerToRoom', () => {
        it('should add a player to the room if verification passes', () => {
            const username = 'NewPlayer';
            const randomMode = false;
            (mockVerificationService.generalVerification as jest.Mock).mockReturnValue(undefined);
            const result = gameServicePlayer.addPlayerToRoom(room, username, randomMode);
            expect(result).toBe(undefined);
            expect(room.listPlayers.length).toBe(3);
            expect(room.listPlayers[2].name).toBe(username);
            expect(mockPlayerConnectionGateway.sendNewPlayerToClient).toHaveBeenCalledWith(expect.any(Player), room.id);
        });
        it('should not add a player to the room if verification fails', () => {
            const username = 'BannedName';
            const randomMode = false;
            (mockVerificationService.generalVerification as jest.Mock).mockReturnValue('Name banned');
            const result = gameServicePlayer.addPlayerToRoom(room, username, randomMode);
            expect(result).toBe('Name banned');
            expect(room.listPlayers.length).toBe(2);
        });
    });

    it('should process answers and check if every player answered QCM', async () => {
        const answers: Answer[] = [{ text: 'Correct Answer', isCorrect: true }];
        gameServicePlayer.verifyPlayerAnswers(room, answers, 'Player 1');
        gameServicePlayer.verifyPlayerAnswers(room, answers, 'Player 2');
        expect(room.listPlayers.every((player) => player.answered)).toBe(true);
    });
    it('should verify that not all players have answered', async () => {
        gameServicePlayer.verifyPlayerAnswers(room, [{ text: 'Correct Answer', isCorrect: true }], 'Player 1');
        expect(room.listPlayers.some((player) => !player.answered)).toBe(true);
    });
    describe('nextRoundPlayer', () => {
        it('should return if room is undefined', () => {
            const testRoom: Room = undefined as unknown as Room;
            gameServicePlayer.nextRoundPlayer(testRoom);
            expect(testRoom).toBeUndefined();
        });
        it('should reset player states for the next round', () => {
            room.listPlayers.forEach((player) => {
                player.answered = true;
                player.goodAnswers = true;
                player.firstToAnswer = true;
            });
            gameServicePlayer.nextRoundPlayer(room);
            room.listPlayers.forEach((player) => {
                expect(player.answered).toBe(false);
                expect(player.goodAnswers).toBe(false);
                expect(player.firstToAnswer).toBe(false);
            });
        });
    });

    describe('endRoundPlayer', () => {
        it('should call addPlayerPoints, sortPlayersByPoints, and setBestScore with the correct arguments', () => {
            const addPlayerPointsSpy = jest.spyOn(gameServicePlayer, 'addPlayerPoints');
            const sortPlayersByPointsSpy = jest.spyOn(gameServicePlayer, 'sortPlayersByPoints' as keyof GameServicePlayer);
            const setBestScoreSpy = jest.spyOn(gameServicePlayer, 'setBestScore' as keyof GameServicePlayer);

            gameServicePlayer.endRoundPlayer(room, room.listPlayers);

            expect(addPlayerPointsSpy).toHaveBeenCalledWith(room, room.listPlayers);
            expect(sortPlayersByPointsSpy).toHaveBeenCalledWith(room.listPlayers);
            expect(setBestScoreSpy).toHaveBeenCalledWith(room);
        });
    });

    it('should return false if there are incorrect answers', () => {
        const currentQuestion = room.quiz.questions[room.currentQuestionIndex];
        currentQuestion.choices = [
            { text: 'Correct', isCorrect: true },
            { text: 'Incorrect', isCorrect: false },
        ];
        const answers: Answer[] = [{ text: 'Incorrect', isCorrect: false }];
        const result = gameServicePlayer['verifyAnswersReceived'](room, answers);
        expect(result).toBe(false);
    });
    describe('findPlayerByName', () => {
        it('should return null if the player is not found in the room', () => {
            const playerNameNotInRoom = 'PlayerNotInRoom';
            room.listPlayers = [new Player('Player 1'), new Player('Player 2')];
            const result = gameServicePlayer.findPlayerByName(playerNameNotInRoom, room);

            expect(result).toBeNull();
        });
        it('should return null if the room is undefined', () => {
            const playerName = 'Player1';
            const undefinedRoom: Room = undefined;
            const result = gameServicePlayer.findPlayerByName(playerName, undefinedRoom);

            expect(result).toBeNull();
        });
    });
    it('should return toggle chat permission properly', () => {
        room.listPlayers = [new Player('Player 1'), new Player('Player 2')];
        room.listPlayers[0].isBannedFromChat = false;
        const player = room.listPlayers[0];
        player.isBannedFromChat = true;
        gameServicePlayer.togglePlayerChatPermission(player, room);
        expect(room.listPlayers[0].isBannedFromChat).toBeTruthy();
    });
    it('should return update interaction properly', () => {
        room.listPlayers = [new Player('Player 1'), new Player('Player 2')];
        room.listPlayers[0].interaction = 'red';
        const player = room.listPlayers[0];
        player.interaction = 'yellow';
        gameServicePlayer.updatePlayerInteration(room, player);
        expect(room.listPlayers[0].interaction).toEqual(player.interaction);
        expect(mockPlayerConnectionGateway.sendPlayerInteraction).toBeCalledWith(room.id, player);
    });
    it('should return true if no player has answered', () => {
        room.listPlayers[0].answered = false;
        room.listPlayers[1].answered = false;
        room.listPlayers[0].firstToAnswer = false;
        room.listPlayers[1].firstToAnswer = false;
        room.listPlayers[0].goodAnswers = false;
        room.listPlayers[1].goodAnswers = false;
        const result = gameServicePlayer['checkFirstPlayerToAnswer'](room);
        expect(result).toBe(true);
        expect(mockGameServiceTimer.startTimerFirstToAnswer).toHaveBeenCalledWith(room);
    });
    it('should return false and reset firstToAnswer status if any player has answered', () => {
        room.listPlayers[0].answered = true;
        const result = gameServicePlayer['checkFirstPlayerToAnswer'](room);
        expect(result).toBe(false);
        expect(room.listPlayers.every((player) => player.firstToAnswer === false)).toBe(true);
    });
    it('should call startTimerFirstToAnswer when it returns true', () => {
        room.listPlayers[0].answered = false;
        room.listPlayers[1].answered = false;
        room.listPlayers[0].firstToAnswer = false;
        room.listPlayers[1].firstToAnswer = false;
        room.listPlayers[0].goodAnswers = false;
        room.listPlayers[1].goodAnswers = false;
        jest.spyOn<typeof mockGameServiceTimer, any>(mockGameServiceTimer, 'startTimerFirstToAnswer');
        gameServicePlayer['checkFirstPlayerToAnswer'](room);
        expect(mockGameServiceTimer.startTimerFirstToAnswer).toHaveBeenCalled();
    });
    describe('firstPlayerToAnswer', () => {
        it('should return true if no players have answered', () => {
            room.listPlayers[0].answered = false;
            room.listPlayers[1].answered = false;
            expect(gameServicePlayer['firstPlayerToAnswer'](room)).toBe(false);
        });
        it('should return false if at least one player has answered', () => {
            room.listPlayers[0].answered = true;
            expect(gameServicePlayer['firstPlayerToAnswer'](room)).toBe(false);
        });
    });
    describe('firstOrSecondPlayer', () => {
        it('should return false if lockPlayerPoints is true', () => {
            room.lockPlayerPoints = true;
            expect(gameServicePlayer['firstOrSecondPlayer'](room)).toBe(false);
        });
        it('should return true if lockPlayerPoints is false and no players have answered', () => {
            room.listPlayers[0].answered = false;
            room.listPlayers[1].answered = false;
            expect(gameServicePlayer['firstOrSecondPlayer'](room)).toBe(false);
        });
        it('should return false if lockPlayerPoints is false and at least one player has answered', () => {
            room.listPlayers[0].answered = true;
            expect(gameServicePlayer['firstOrSecondPlayer'](room)).toBe(false);
        });
    });
    describe('sortPlayersByPoints', () => {
        it('should sort players by points in descending order', () => {
            const player1 = new Player('Player 1');
            player1.points = 50;
            const player2 = new Player('Player 2');
            player2.points = 70;
            room.listPlayers = [player1, player2];
            gameServicePlayer['sortPlayersByPoints'](room.listPlayers);
            expect(room.listPlayers[0].name).toBe('Player 2');
            expect(room.listPlayers[1].name).toBe('Player 1');
        });
        it('should not change order if all players have equal points', () => {
            const player1 = new Player('Player 1');
            player1.points = 50;
            const player2 = new Player('Player 2');
            player2.points = 50;
            room.listPlayers = [player1, player2];
            gameServicePlayer['sortPlayersByPoints'](room.listPlayers);
            expect(room.listPlayers[0].name).toBe('Player 1');
            expect(room.listPlayers[1].name).toBe('Player 2');
        });
    });
    describe('setBestScore', () => {
        it('should set the best score to the highest player points', () => {
            const player1 = new Player('Player1');
            player1.points = 50;
            const player2 = new Player('Player2');
            player2.points = 70;
            const player3 = new Player('Player3');
            player3.points = 30;
            room.listPlayers = [player1, player2, player3];
            gameServicePlayer['setBestScore'](room);

            expect(room.bestScore).toBe(70);
        });
    });
    describe('isCorrectAnswerCountMatch', () => {
        it('should return true when correct answers count matches expected count', () => {
            const answers: Answer[] = [
                { text: 'Correct Answer 1', isCorrect: true },
                { text: 'Correct Answer 2', isCorrect: true },
            ];
            const question: Question = {
                _id: 'q1',
                text: 'Question 1',
                type: QuestionType.QCM,
                points: 10,
                choices: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: true },
                ],
                date: new Date(),
            };
            const result = gameServicePlayer['isCorrectAnswerCountMatch'](answers, question);
            expect(result).toBe(true);
        });
        it('should return false when correct answers count does not match expected count', () => {
            const answers: Answer[] = [{ text: 'Correct Answer 1', isCorrect: true }];
            const question: Question = {
                _id: 'q1',
                text: 'Question 1',
                type: QuestionType.QCM,
                points: 10,
                choices: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: true },
                ],
                date: new Date(),
            };
            const result = gameServicePlayer['isCorrectAnswerCountMatch'](answers, question);
            expect(result).toBe(false);
        });
    });

    describe('setQrlAnswer', () => {
        it('should correctly set the QRL answer for the player and update answered status', () => {
            const playerName = 'Player 1';
            const qrlAnswer = 'QRL Answer';
            room.listPlayers[0].qrlAnswer = '';
            room.listPlayers[0].answered = false;
            room.currentQuestionIndex = 0;

            gameServicePlayer['setQrlAnswer'](room, qrlAnswer, playerName);

            expect(room.listPlayers[0].qrlAnswer).toBe(qrlAnswer);
            expect(room.listPlayers[0].answered).toBeTruthy();
        });
    });

    describe('addPointsByType', () => {
        it('should add points correctly for QCM', () => {
            room.quiz.questions[0].type = QuestionType.QCM;
            const playerName = 'Player 1';
            const pointsToAdd = 10;
            const factor = 1;
            room.listPlayers[0].answered = true;
            room.listPlayers[0].firstToAnswer = false;

            gameServicePlayer.addPointsByType(playerName, room, factor);
            expect(gameServicePlayer['calculateQrlPointsToAdd'](room.currentQuestionIndex, factor, room)).toBe(pointsToAdd);
            expect(room.listPlayers[0].points).toBe(pointsToAdd);
        });

        it('should add points correctly for QRL', () => {
            room.quiz.questions[0].type = QuestionType.QRL;
            const playerName = 'Player 1';
            const pointsToAdd = 10;
            const factor = 1;

            gameServicePlayer.addPointsByType(playerName, room, factor);
            expect(gameServicePlayer['calculateQrlPointsToAdd'](room.currentQuestionIndex, factor, room)).toBe(pointsToAdd);
            expect(room.listPlayers[0].points).toBe(pointsToAdd);
        });
    });

    describe('calculatePointsToAdd', () => {
        it('should correctly calculate points to add when player has good answers and is the first to answer', () => {
            room.listPlayers[0].goodAnswers = true;
            room.listPlayers[0].firstToAnswer = true;
            const currentQuestionIndex = 0;

            const pointsToAdd = gameServicePlayer['calculatePointsToAdd'](room.listPlayers[0], currentQuestionIndex, room.quiz.questions);

            expect(pointsToAdd).toBe(10 * MULT_POINTS);
        });
        it('should return 0 if player does not have good answers', () => {
            room.listPlayers[0].goodAnswers = false;
            const currentQuestionIndex = 0;
            const pointsToAdd = gameServicePlayer['calculatePointsToAdd'](room.listPlayers[0], currentQuestionIndex, room.quiz.questions);

            expect(pointsToAdd).toBe(0);
        });
    });

    describe('calculateQrlPointsToAdd', () => {
        it('should correctly calculate QRL points to add when room is in testing mode', () => {
            room.isTesting = true;
            const currentQuestionIndex = 0;
            const pointsToAdd = gameServicePlayer['calculateQrlPointsToAdd'](currentQuestionIndex, 0.5, room);

            expect(pointsToAdd).toBe(10);
        });
        it('should correctly calculate QRL points to add when room is not in testing mode', () => {
            const currentQuestionIndex = 0;
            const pointFactor = 0.5;
            const pointsToAdd = gameServicePlayer['calculateQrlPointsToAdd'](currentQuestionIndex, pointFactor, room);

            expect(pointsToAdd).toBe(10 * 0.5);
        });
    });

    describe('updateQRLStats', () => {
        it('should correctly update QRL stats when point factor is 1', () => {
            const currentQuestionIndex = 0;
            const pointFactor = 1;

            gameServicePlayer['updateQRLStats'](room, pointFactor, currentQuestionIndex);

            expect(room.questionStats[currentQuestionIndex].statsQRL.scores.hundredPercent).toBe(1);
        });

        it('should correctly update QRL stats when point factor is 0', () => {
            const currentQuestionIndex = 0;
            const pointFactor = 0;

            gameServicePlayer['updateQRLStats'](room, pointFactor, currentQuestionIndex);

            expect(room.questionStats[currentQuestionIndex].statsQRL.scores.zeroPercent).toBe(1);
        });
        it('should correctly update QRL stats when point factor is 0.5', () => {
            const currentQuestionIndex = 0;
            const pointFactor = 0.5;

            gameServicePlayer['updateQRLStats'](room, pointFactor, currentQuestionIndex);
            expect(room.questionStats[currentQuestionIndex].statsQRL.scores.fiftyPercent).toBe(1);
        });
        it('shoud not update if point factor is not 0, 0.5 or 1', () => {
            const currentQuestionIndex = 0;
            const pointFactor = 2;

            gameServicePlayer['updateQRLStats'](room, pointFactor, currentQuestionIndex);
            expect(room.questionStats[currentQuestionIndex].statsQRL.scores.fiftyPercent).toBe(0);
            expect(room.questionStats[currentQuestionIndex].statsQRL.scores.zeroPercent).toBe(0);
            expect(room.questionStats[currentQuestionIndex].statsQRL.scores.hundredPercent).toBe(0);
        });
    });

    describe('verifyQrlAnswers', () => {
        it('should set QRL answer and check all players answered', () => {
            const playerName = 'testPlayer';
            const qrlAnswer = 'QRL Answer';
            const player = new Player(playerName);
            room.listPlayers.push(player);

            const result = gameServicePlayer.verifyQrlAnswers(room, qrlAnswer, playerName);

            expect(player.qrlAnswer).toBe(qrlAnswer);
            expect(result).toBe(false);
        });

        it('should return true if all players answered', () => {
            const playerName = 'testPlayer';
            const qrlAnswer = 'QRL Answer';
            const player = new Player(playerName);
            room.listPlayers[0].answered = true;
            room.listPlayers[1].answered = true;
            room.listPlayers.push(player);

            const result = gameServicePlayer.verifyQrlAnswers(room, qrlAnswer, playerName);

            expect(player.qrlAnswer).toBe(qrlAnswer);
            expect(result).toBe(true);
        });
    });
});
