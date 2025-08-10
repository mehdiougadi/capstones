import { Room } from '@app/common-server/room';
import { Answer } from '@app/model/database/answer';
import { Quiz } from '@app/model/database/quiz';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { UpdateStatsGateway } from './update-stats.gateway';

export const mockGameService = {
    updateStatsSelectedOptions: jest.fn().mockImplementation((roomId) => {
        const simulatedRoom: Room = {
            id: roomId,
            quiz: {} as Quiz,
            accessCode: 'log2990',
            listPlayers: [],
            currentQuestionIndex: 0,
            roundFinished: false,
            isLocked: false,
            isTesting: false,
            isPaused: false,
            isPanicMode: false,
            bestScore: 0,
            dateCreated: new Date(),
            currentState: 'GameState.END_ROUND',
            numberOfPlayers: 0,
            randomMode: false,
            nameBanned: [],
            lockPlayerPoints: false,
            currentTime: 0,
            questionStats: [
                {
                    questionIndex: 1,
                    questionType: 'QCM',
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
            ],
        };
        return simulatedRoom;
    }),

    updateQRLModified: jest.fn().mockImplementation((roomId, indexQuestion) => {
        const simulatedRoom: Room = {
            id: roomId,
            quiz: {} as Quiz,
            accessCode: 'log2990',
            listPlayers: [],
            currentQuestionIndex: 0,
            roundFinished: false,
            isLocked: false,
            isTesting: false,
            isPaused: false,
            isPanicMode: false,
            bestScore: 0,
            dateCreated: new Date(),
            currentState: 'GameState.END_ROUND',
            numberOfPlayers: 0,
            randomMode: false,
            nameBanned: [],
            lockPlayerPoints: false,
            currentTime: 0,
            questionStats: [
                {
                    questionIndex: indexQuestion,
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
            ],
        };
        return simulatedRoom;
    }),
};

describe('UpdateStatsGateway', () => {
    let gateway: UpdateStatsGateway;
    let mockServerEmit: jest.Mock;
    let mockSocket: Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UpdateStatsGateway, { provide: GameService, useValue: mockGameService }],
        }).compile();

        gateway = module.get<UpdateStatsGateway>(UpdateStatsGateway);
        mockServerEmit = jest.fn();
        gateway['server'] = { emit: mockServerEmit } as Partial<Server> as Server;
        mockSocket = {} as Socket;
    });

    describe('sendStatsUpdate', () => {
        it('should emit updated stats to the client', () => {
            const choice: Answer = { text: 'choiceA', isCorrect: true };
            const message: [string, Answer, number] = ['roomId', choice, 0];

            gateway.sendStatsUpdate(mockSocket, message);

            expect(mockGameService.updateStatsSelectedOptions).toHaveBeenCalledWith('roomId', choice, 0);

            expect(mockServerEmit).toHaveBeenCalledWith('sendUpdatedStats:roomId', mockGameService.updateStatsSelectedOptions().questionStats);
        });
    });

    describe('sendUpdatedStats', () => {
        it('should emit the questionsStats to the client', () => {
            const roomId = 'testRoomId';

            gateway.sendUpdatedStats(roomId, mockGameService.updateStatsSelectedOptions().questionStats);

            expect(mockServerEmit).toHaveBeenCalledWith('sendUpdatedStats:testRoomId', [
                {
                    questionIndex: 1,
                    questionType: 'QCM',
                    stats: {
                        choiceA: { count: 10, isCorrect: true },
                        choiceB: { count: 5, isCorrect: false },
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
                },
            ]);
        });
    });
});
