import { Answer } from '@common/interfaces/answer';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { GameConnectionGateway } from './game-connection.gateway';

describe('GameConnectionGateway', () => {
    let gateway: GameConnectionGateway;
    let mockServerEmit: jest.Mock;
    let mockSocketEmit: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameConnectionGateway],
        }).compile();

        gateway = module.get<GameConnectionGateway>(GameConnectionGateway);

        mockServerEmit = jest.fn();
        mockSocketEmit = jest.fn();
        gateway['server'] = { emit: mockServerEmit } as Partial<Server> as Server;
        gateway['socket'] = { emit: mockSocketEmit } as Partial<Socket> as Socket;
    });

    describe('startGame', () => {
        it('should emit the start game event for the given room id', () => {
            const roomId = 'testRoomId';

            gateway.startGame(roomId);

            expect(mockServerEmit).toHaveBeenCalledWith(`startGameWithId:${roomId}`);
        });
    });

    describe('sendRoomState', () => {
        it('should emit the room state for the given room id and state', () => {
            const roomId = 'testRoomId';
            const roomState = 'testState';

            gateway.sendRoomState(roomId, roomState);

            expect(mockServerEmit).toHaveBeenCalledWith(`sendRoomState:${roomId}`, roomState);
        });
    });
    it('banPlayerFromRoom should emit ban player event with room ID and player name', () => {
        const roomId = '123';
        const playerToKick = 'player1';
        gateway.banPlayerFromRoom(roomId, playerToKick);
        expect(mockServerEmit).toHaveBeenCalledWith(`banPlayerFromRoom:${roomId}`, playerToKick);
    });

    describe('sendUpdatedStats', () => {
        it('should emit the sendStatsUpdate event with answer and action', () => {
            const roomId = 'testRoomId';
            const answer: Answer = { text: 'Test answer', isCorrect: true };
            const action = 1;

            gateway.sendUpdatedStats(roomId, answer, action);
            expect(mockSocketEmit).toHaveBeenCalledWith('sendStatsUpdate', answer, action);
        });

        it('should not emit if roomId is falsy', () => {
            const roomId = '';
            const answer: Answer = { text: 'Test answer', isCorrect: true };
            const action = 1;
            gateway.sendUpdatedStats(roomId, answer, action);
            expect(mockSocketEmit).not.toHaveBeenCalled();
        });
    });
});
