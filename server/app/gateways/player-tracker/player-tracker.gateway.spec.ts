/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Room } from '@app/common-server/room';
import { TIMEOUT } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';
import { Question } from '@common/interfaces/question';
import { PlayerTrackerGateway } from './player-tracker.gateway';

describe('PlayerTrackerGateway', () => {
    let playerTrackerGateway;
    let mockGameService;
    let mockSocket;
    let room: Room;
    beforeEach(() => {
        mockGameService = {
            findRoomById: jest.fn(),
            changeGameState: jest.fn(),
            deletePlayerFromRoom: jest.fn(),
        };
        room = {
            id: 'room1',
            listPlayers: [],
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
            randomMode: false,
            isTesting: false,
            isPaused: false,
            currentState: GameState.TRANSITION,
            timer: setTimeout(() => {
                /* empty */
            }, TIMEOUT),
            questionStats: [],
        };
        playerTrackerGateway = new PlayerTrackerGateway(mockGameService);
    });
    it('should add a new host correctly when connectHost is called', () => {
        mockGameService = {
            findRoomById: jest.fn(),
            changeGameState: jest.fn(),
        };
        mockSocket = {
            id: 'socketId1',
            emit: jest.fn(),
        };
        const roomId = 'roomId1';
        playerTrackerGateway.connectHost(mockSocket, roomId);

        expect(playerTrackerGateway.hosts).toContainEqual({
            username: 'Admin',
            socketId: mockSocket.id,
            roomId,
        });
    });
    it('should add a new player correctly when connectPlayer is called', () => {
        const roomId = 'roomId1';
        const playerName = 'Player1';
        const room1 = { currentState: 'NOT_GameState.TRANSITION', id: roomId };

        mockGameService.findRoomById.mockReturnValue(room1);

        playerTrackerGateway.connectPlayer(mockSocket, { roomId, playerName });

        expect(playerTrackerGateway.players).toContainEqual({
            username: playerName,
            socketId: mockSocket.id,
            roomId,
        });
        expect(mockGameService.changeGameState).not.toHaveBeenCalled();
    });

    it('should change game state if room is in GameState.TRANSITION state when a player connects', () => {
        jest.spyOn(mockGameService, 'changeGameState');
        jest.spyOn<typeof playerTrackerGateway, any>(playerTrackerGateway, 'changeStateIfAllConnected');
        mockGameService.findRoomById.mockReturnValue(room);
        jest.useFakeTimers();
        playerTrackerGateway.connectPlayer(mockSocket, { roomId: room.id, username: 'Player 1' });
        playerTrackerGateway.players = [];
        jest.runAllTimers();
        expect(mockGameService.changeGameState).toHaveBeenCalled();
    });

    describe('handleDisconnect', () => {
        it('should correctly process host disconnect', () => {
            const mockClient = { id: 'hostSocketId' };
            playerTrackerGateway.hosts = [{ username: 'Admin', socketId: 'hostSocketId', roomId: 'roomId' }];

            playerTrackerGateway.handleDisconnect(mockClient);

            expect(mockGameService.changeGameState).toHaveBeenCalledWith('roomId', GameState.END_ROOM);
            expect(playerTrackerGateway.hosts).toHaveLength(0);
        });
        it('should correctly process host disconnect', () => {
            const mockClient = { id: 'hostSocketId' };
            mockGameService.findRoomById.mockReturnValue(room);
            room.randomMode = true;
            room.currentState = GameState.BEFORE_START;
            playerTrackerGateway.hosts = [{ username: 'Admin', socketId: 'hostSocketId', roomId: 'roomId' }];

            playerTrackerGateway.handleDisconnect(mockClient);

            expect(playerTrackerGateway.hosts).toHaveLength(0);
        });

        it('should correctly process player disconnect when not in GameState.TRANSITION state', () => {
            const mockClient = { id: 'playerSocketId' };
            const mockRoom = { id: 'roomId', currentState: 'not GameState.TRANSITION' };
            mockGameService.findRoomById.mockReturnValue(mockRoom);

            playerTrackerGateway.players = [{ username: 'Player', socketId: 'playerSocketId', roomId: 'roomId' }];

            playerTrackerGateway.handleDisconnect(mockClient);

            expect(mockGameService.deletePlayerFromRoom).toHaveBeenCalledWith(mockRoom, 'Player');
            expect(playerTrackerGateway.players).toHaveLength(0);
        });

        it('should change game state if all players have the same room ID', () => {
            const roomId = 'roomId1';
            const testRoom = { id: roomId, listPlayers: [{ roomId }, { roomId }] };
            jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => callback() as any);
            mockGameService.findRoomById.mockReturnValue(testRoom);
            playerTrackerGateway.players.push({ roomId: 'differentRoomId' });
            playerTrackerGateway.changeStateIfAllConnected(testRoom, roomId);
        });

        it('should not delete player when room is null', () => {
            const mockClient = { id: 'playerSocketId' };
            mockGameService.findRoomById.mockReturnValue(null);

            playerTrackerGateway.players = [{ username: 'Player', socketId: 'playerSocketId', roomId: 'roomId' }];

            playerTrackerGateway.handleDisconnect(mockClient);

            expect(mockGameService.deletePlayerFromRoom).not.toHaveBeenCalled();
            expect(playerTrackerGateway.players).toHaveLength(1);
        });
    });
});
