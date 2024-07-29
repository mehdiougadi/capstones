import { Player } from '@common/classes/player';
import { Answer } from '@common/interfaces/answer';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { PlayerConnectionGateway } from './player-connection.gateway';

describe('PlayerConnectionGateway', () => {
    let gateway: PlayerConnectionGateway;
    let mockServerEmit: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PlayerConnectionGateway],
        }).compile();

        gateway = module.get<PlayerConnectionGateway>(PlayerConnectionGateway);

        mockServerEmit = jest.fn();
        gateway['server'] = { emit: mockServerEmit } as Partial<Server> as Server;
    });

    describe('sendNewPlayerToClient', () => {
        it('should emit the new player event to the given room', () => {
            const player = new Player('TestPlayer');
            const roomId = 'testRoomId';

            gateway.sendNewPlayerToClient(player, roomId);

            expect(mockServerEmit).toHaveBeenCalledWith(`addingPlayerToRoom:${roomId}`, player);
        });
    });

    describe('sendPlayerInteraction', () => {
        it('should emit the new player interaction to the given room', () => {
            const player = new Player('TestPlayer');
            const roomId = 'testRoomId';

            gateway.sendPlayerInteraction(roomId, player);

            expect(mockServerEmit).toHaveBeenCalledWith(`updatePlayerInteraction:${roomId}`, player);
        });
    });

    describe('sendLeftPlayerToClient', () => {
        it('should emit the player left event from the given room', () => {
            const player = new Player('TestPlayer');
            const roomId = 'testRoomId';
            const isBanned = true;

            gateway.sendLeftPlayerToClient(player, roomId, isBanned);

            expect(mockServerEmit).toHaveBeenCalledWith(`removingPlayerFromRoom:${roomId}`, player, isBanned);
        });
    });

    describe('updateStats', () => {
        it('should emit the update stats event for the given room with answers and current question index', () => {
            const roomId = 'testRoomId';
            const answers: Answer[] = [
                { text: 'Answer 1', isCorrect: true },
                { text: 'Answer 2', isCorrect: false },
            ];
            const currentQuestionIndex = 1;

            gateway.updateStats(roomId, answers, currentQuestionIndex);

            expect(mockServerEmit).toHaveBeenCalledWith('updateStats', {
                roomId,
                answers,
                currentQuestionIndex,
            });
        });
    });

    describe('sendPlayersUpdate', () => {
        it('should emit the players update event for the given room with players array', () => {
            const roomId = 'testRoomId';
            const players: Player[] = [new Player('Player1'), new Player('Player2')];

            gateway.sendPlayersUpdate(roomId, players);

            expect(mockServerEmit).toHaveBeenCalledWith(`sendPlayersUpdate:${roomId}`, players);
        });

        it('should not emit if roomId is falsy', () => {
            const roomId = '';
            const players: Player[] = [new Player('Player1'), new Player('Player2')];

            gateway.sendPlayersUpdate(roomId, players);

            expect(mockServerEmit).not.toHaveBeenCalled();
        });
    });

    describe('sendUpdatedStats', () => {
        it('should emit the questionsStats to the client', () => {
            const roomId = 'testRoomId';
            const questionStatistics: QuestionStats[] = [
                {
                    questionIndex: 0,
                    questionType: 'QRL',
                    stats: { ['choiceA']: { count: 10, isCorrect: true }, ['choiceB']: { count: 5, isCorrect: false } },
                    statsQRL: {
                        modifiedLastSeconds: 0,
                        notModifiedLastSeconds: 0,
                        scores: {
                            zeroPercent: 0,
                            fiftyPercent: 0,
                            hundredPercent: 0,
                        },
                    },
                },
            ];

            gateway.sendUpdatedStats(roomId, questionStatistics);

            expect(mockServerEmit).toHaveBeenCalledWith(`sendUpdatedStats:${roomId}`, questionStatistics);
        });
    });
});
