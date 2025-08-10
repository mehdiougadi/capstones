// retrait du lint pour le nombre maximum de ligne (je dois tester plusieurs fonctions)
/* eslint-disable max-lines */
// retrait du lint any pour accéder aux propriétés privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ERROR_NAME_ALREADY_EXIST,
    EmitMessageType,
    LOBBY_NOT_EXISTING,
    ORG_BANNED_NAME,
    logClientDisconnectedFromServer,
    logPlayerLeavingRoom,
    logRoomDestroy,
    logRoomJoining,
    logSocketLeavingRoom,
} from '@app/app.constants';
import { LobbyService } from '@app/services/lobby/lobby/lobby.service';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { LobbyGateway } from './lobby.gateway';

describe('LobbyGateway', () => {
    let lobbyGateway: LobbyGateway;
    let lobbyService: LobbyService;
    let logger: Logger;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        socket = createStubInstance<Socket>(Socket);
        (socket as any).id = testId;
        server = Object.assign(createStubInstance<Server>(Server), {
            sockets: {
                sockets: new Map([[socket.id, socket]]),
            },
        });
        const module = await Test.createTestingModule({
            providers: [
                LobbyGateway,
                {
                    provide: LobbyService,
                    useValue: {
                        lobbyService,
                    },
                },
                {
                    provide: 'SharedRooms',
                    useValue: { a234: lobbyId1 },
                },
                Logger,
            ],
        }).compile();

        lobbyGateway = module.get<LobbyGateway>(LobbyGateway);
        lobbyService = module.get<LobbyService>(LobbyService);
        logger = module.get<Logger>(Logger);
        lobbyGateway['server'] = server;
        (lobbyGateway as any).rooms[socket.id] = lobbyId1;
    });

    it('should be defined', () => {
        expect(lobbyGateway).toBeDefined();
    });

    it('should create room', async () => {
        const lobbyId = 'testLobbyId';
        lobbyService.createLobby = jest.fn().mockResolvedValue(lobbyId);
        jest.spyOn(logger, 'log');

        await lobbyGateway.handleCreateRoom(socket, 'testGameId');

        expect(lobbyService.createLobby).toHaveBeenCalledWith('testGameId');
        expect(logger.log).toHaveBeenCalledWith('The room: ' + lobbyId + ' was created');
        expect(socket.join.calledWith(lobbyId)).toBe(true);
        expect(socket.emit.calledWith(EmitMessageType.RoomCreation, { success: true, message: 'La session a été créée avec succès!' })).toBe(true);
    });

    it('should not create a room if there is an error', async () => {
        const lobbyId = 'testLobbyId';
        lobbyService.createLobby = jest.fn().mockRejectedValue('nope');
        jest.spyOn(logger, 'log');

        await lobbyGateway.handleCreateRoom(socket, 'testGameId');

        expect(lobbyService.createLobby).toHaveBeenCalledWith('testGameId');
        expect(logger.log).not.toHaveBeenCalledWith('The room: ' + lobbyId + ' was created');
        expect(socket.emit.calledWith(EmitMessageType.RoomCreation, { success: false, message: "La session n'a pas pu être créée, " + 'nope' })).toBe(
            true,
        );
    });

    it('should check if the room exist and return roomJoining with true if it does', () => {
        const lobbyId = 'testLobbyId';
        lobbyService.checkIfJoinable = jest.fn().mockReturnValue('');
        jest.spyOn(logger, 'log');
        lobbyService.addSocketToLobby = jest.fn();
        lobbyGateway.handleJoin(socket, lobbyId);

        expect(lobbyService.checkIfJoinable).toHaveBeenCalled();
        expect(socket.join.calledWith(lobbyId)).toBe(true);
        expect(logger.log).toHaveBeenCalledWith(logRoomJoining(socket.id, lobbyId));
        expect(lobbyService.addSocketToLobby).toHaveBeenCalledWith(lobbyId, socket.id);
        expect(
            socket.emit.calledWith(EmitMessageType.RoomJoining, {
                success: true,
                message: 'Vous avez rejoint la session ' + lobbyId + ' avec succès!',
            }),
        ).toBe(true);
    });

    it("should check if the room exist and return roomJoining with false if it doesn't", () => {
        const lobbyId = 'testLobbyId';
        lobbyService.checkIfJoinable = jest.fn().mockReturnValue(LOBBY_NOT_EXISTING);
        jest.spyOn(logger, 'log');

        lobbyGateway.handleJoin(socket, lobbyId);

        expect(lobbyService.checkIfJoinable).toHaveBeenCalled();
        expect(socket.join.notCalled).toBe(true);
        expect(logger.log).not.toHaveBeenCalled();
        expect(socket.emit.calledWith(EmitMessageType.RoomJoining, { success: false, message: LOBBY_NOT_EXISTING })).toBe(true);
    });

    it('should handle choose name when player name does not exist', () => {
        const playerName = 'testPlayerName';
        lobbyService.checkPlayerName = jest.fn().mockReturnValue(ERROR_NAME_ALREADY_EXIST);
        lobbyGateway.handleChooseName(socket, playerName);

        expect(lobbyService.checkPlayerName).toHaveBeenCalledWith(lobbyId1, playerName);
        expect(socket.emit.calledWith(EmitMessageType.ChooseNameError, ERROR_NAME_ALREADY_EXIST)).toBe(true);
    });

    it('should handle choose name when player name exist', () => {
        const playerName = 'testPlayerName';
        lobbyService.checkPlayerName = jest.fn().mockReturnValue('');
        lobbyService.addPlayerToLobby = jest.fn();
        lobbyService.getPLayersFromLobby = jest.fn();
        lobbyService.getSocketIdInLobby = jest.fn().mockReturnValue([testId]);
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.NewPlayer);
            },
        } as BroadcastOperator<any, any>);

        lobbyGateway.handleChooseName(socket, playerName);

        expect(lobbyService.checkPlayerName).toHaveBeenCalledWith(lobbyId1, playerName);
        expect(lobbyService.addPlayerToLobby).toHaveBeenCalledWith(lobbyId1, playerName, socket.id);
        expect(lobbyService.getPLayersFromLobby).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handle start game when player name does not exist', () => {
        socket.data = {};
        lobbyService.getSocketIdInLobby = jest.fn().mockReturnValue([testId]);
        lobbyService.setInGame = jest.fn();
        lobbyGateway.handleLeaveLobby = jest.fn();

        lobbyGateway.handleStartGame(socket);

        expect(lobbyService.setInGame).toHaveBeenCalledWith(lobbyId1);
        expect(lobbyGateway.handleLeaveLobby).toHaveBeenCalledWith(socket);
    });

    it('should handle start game when player name exists', () => {
        socket.data = { playerName: 'testName' };
        lobbyService.getSocketIdInLobby = jest.fn().mockReturnValue([testId]);
        stub(socket, 'rooms').value({ [lobbyId1]: {} });
        lobbyService.setInGame = jest.fn();

        lobbyGateway.handleStartGame(socket);

        expect(lobbyService.setInGame).toHaveBeenCalledWith(lobbyId1);
        expect(lobbyService.getSocketIdInLobby).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handle connection', () => {
        jest.spyOn(logger, 'log');

        lobbyGateway.handleConnection(socket);

        expect(logger.log).toHaveBeenCalledWith('Client: ' + socket.id + ' connected to the server');
    });

    it('should handle disconnect and call leaveLobby if the player is in game', () => {
        jest.spyOn(lobbyGateway, 'handleLeaveLobby').mockImplementation(() => {
            return;
        });
        jest.spyOn(logger, 'log');

        lobbyGateway.handleDisconnect(socket);

        expect(lobbyGateway.handleLeaveLobby).toHaveBeenCalledWith(socket);
        expect(logger.log).toHaveBeenCalledWith(logClientDisconnectedFromServer(testId));
    });

    it('should handle disconnect and not call leaveLobby and emit disconnected if the socket is not in a room', () => {
        jest.spyOn(lobbyGateway, 'handleLeaveLobby').mockImplementation(() => {
            return;
        });
        jest.spyOn(logger, 'log');
        delete (lobbyGateway as any).rooms[socket.id];

        lobbyGateway.handleDisconnect(socket);

        expect(lobbyGateway.handleLeaveLobby).not.toHaveBeenCalledWith(socket);
        expect(socket.emit.calledWith(EmitMessageType.Disconnected)).toBe(true);
        expect(logger.log).toHaveBeenCalledWith(logClientDisconnectedFromServer(testId));
    });

    it('should handleRequestRoomId', () => {
        lobbyGateway.handleRequestRoomId(socket);
        expect(socket.emit.calledWith(EmitMessageType.RoomId, lobbyId1)).toBe(true);
    });

    it('should handleRequestCurrentPlayer', () => {
        lobbyService.getPLayersFromLobby = jest.fn();
        lobbyGateway.handleRequestCurrentPlayer(socket);
        expect(socket.emit.calledWith(EmitMessageType.NewPlayer, lobbyService.getPLayersFromLobby(lobbyId1))).toBe(true);
    });

    it('should handleRequestName', () => {
        socket.data = { playerName: testId };
        lobbyGateway.handleRequestName(socket);
        expect(socket.emit.calledWith(EmitMessageType.PlayerName, socket.data.playerName)).toBe(true);
    });

    it('should handleLockLobby', () => {
        lobbyService.lockLobby = jest.fn();
        lobbyGateway.handleLockLobby(socket, true);
        expect(lobbyService.lockLobby).toHaveBeenCalledWith(lobbyId1, true);
    });

    it('should handleLeaveLobby when the player have no name', () => {
        socket.data = {};
        lobbyService.deletePlayerFromLobby = jest.fn();
        logger.log = jest.fn();
        lobbyService.removeSocketIdFromLobby = jest.fn();
        lobbyService.isInGame = jest.fn().mockReturnValue(true);

        lobbyGateway.handleLeaveLobby(socket);

        expect(lobbyService.removeSocketIdFromLobby).toHaveBeenCalledWith(socket.id, lobbyId1);
        expect(lobbyService.deletePlayerFromLobby).toHaveBeenCalledWith(lobbyId1, '');
        expect(logger.log).toHaveBeenCalledWith(logSocketLeavingRoom(socket.id, lobbyId1));
        expect(socket.leave.calledWith(lobbyId1));
        expect(socket.emit.calledWith(EmitMessageType.Disconnected));
        expect((lobbyGateway as any).rooms[socket.id]).toBeUndefined();
    });

    it('should handleLeaveLobby when the player name is Organisateur', () => {
        socket.data = { playerName: ORG_BANNED_NAME };
        const stubDeleteRoom = ((lobbyGateway as any).deleteRoom = jest.fn());
        lobbyService.removeSocketIdFromLobby = jest.fn();
        lobbyService.isInGame = jest.fn().mockReturnValue(true);
        lobbyGateway.handleLeaveLobby(socket);

        expect(lobbyService.removeSocketIdFromLobby).toHaveBeenCalledWith(socket.id, lobbyId1);
        expect(stubDeleteRoom).toHaveBeenCalledWith(socket, lobbyId1);
        expect(socket.leave.calledWith(lobbyId1));
        expect(socket.emit.calledWith(EmitMessageType.Disconnected));
        expect((lobbyGateway as any).rooms[socket.id]).toBeUndefined();
    });

    it('should handleLeaveLobby when the player name is alone', () => {
        socket.data = { playerName: 'test' };
        lobbyService.getPLayersFromLobby = jest.fn().mockReturnValue(['test']);
        const stubDeleteRoom = ((lobbyGateway as any).deleteRoom = jest.fn());
        lobbyService.isInGame = jest.fn().mockReturnValue(true);
        lobbyService.removeSocketIdFromLobby = jest.fn();

        lobbyGateway.handleLeaveLobby(socket);

        expect(lobbyService.removeSocketIdFromLobby).toHaveBeenCalledWith(socket.id, lobbyId1);
        expect(lobbyService.getPLayersFromLobby).toHaveBeenCalledWith(lobbyId1);
        expect(stubDeleteRoom).toHaveBeenCalledWith(socket, lobbyId1);
        expect(socket.leave.calledWith(lobbyId1));
        expect(socket.emit.calledWith(EmitMessageType.Disconnected));
        expect((lobbyGateway as any).rooms[socket.id]).toBeUndefined();
    });

    it('should handleLeaveLobby when the player has a name different then Organisateur and is not alone', () => {
        socket.data = { playerName: 'player1' };
        lobbyService.deletePlayerFromLobby = jest.fn();
        lobbyService.getPLayersFromLobby = jest.fn().mockReturnValue(['player1', 'player2']);
        lobbyService.removeSocketIdFromLobby = jest.fn();
        lobbyService.isInGame = jest.fn().mockReturnValue(true);
        logger.log = jest.fn();
        server.to.returns({
            emit: (event: string, data: string) => {
                expect(event).toEqual(EmitMessageType.PlayerDisconnected);
                expect(data).toEqual(socket.data.playerName);
            },
        } as BroadcastOperator<any, any>);
        lobbyGateway.handleLeaveLobby(socket);

        expect(lobbyService.removeSocketIdFromLobby).toHaveBeenCalledWith(socket.id, lobbyId1);
        expect(logger.log).toHaveBeenCalledWith(logPlayerLeavingRoom('player1', lobbyId1));
        expect(lobbyService.deletePlayerFromLobby).toHaveBeenCalledWith(lobbyId1, 'player1');
        expect(lobbyService.getPLayersFromLobby).toHaveBeenCalledWith(lobbyId1);
        expect(socket.leave.calledWith(lobbyId1));
        expect(socket.emit.calledWith(EmitMessageType.Disconnected));
        expect((lobbyGateway as any).rooms[socket.id]).toBeUndefined();
    });

    it('should handleKickPlayer', () => {
        server.sockets.sockets.get = jest.fn().mockReturnValue(socket);
        lobbyService.addBannedPlayer = jest.fn().mockReturnValue(testId);
        lobbyGateway.handleLeaveLobby = jest.fn();

        lobbyGateway.handleKickPlayer(socket, testId);

        expect(lobbyService.addBannedPlayer).toHaveBeenCalledWith(lobbyId1, testId);
        expect(socket.emit.calledWith(EmitMessageType.PlayerKicked)).toBe(true);
        expect(lobbyGateway.handleLeaveLobby).toHaveBeenCalledWith(socket);
    });

    it('should handleRetrieveGameId', () => {
        lobbyService.getGameIdFromLobby = jest.fn().mockReturnValue(testId);

        lobbyGateway.handleRetrieveGameId(socket);

        expect(lobbyService.getGameIdFromLobby).toHaveBeenCalledWith(lobbyId1);
        expect(socket.emit.calledWith(EmitMessageType.RetrieveGameId, testId)).toBe(true);
    });

    it('deleteRoom should delete the room associate to the organizer and remove all player and socket', () => {
        socket.data = { playerName: ORG_BANNED_NAME };
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: 'bonjour' };
        let socketTest2: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest2 = createStubInstance<Socket>(Socket);
        (socketTest2 as any).id = socketIdTest3;

        lobbyService.getSocketIdInLobby = jest.fn().mockReturnValue([socket.id, socketTest.id, socketTest2.id]);
        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        mockMap.set(socketTest2.id, socketTest2);

        (lobbyGateway.server.sockets.sockets as any) = mockMap;
        lobbyGateway.server.sockets.sockets.get = jest
            .fn()
            .mockReturnValueOnce(socket)
            .mockReturnValueOnce(socketTest)
            .mockReturnValueOnce(socketTest2);
        lobbyService.removeSocketIdFromLobby = jest.fn();
        logger.log = jest.fn();
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.Disconnected);
            },
        } as BroadcastOperator<any, any>);

        lobbyService.deleteLobby = jest.fn();

        (lobbyGateway as any).deleteRoom(socket, lobbyId1);

        expect(lobbyService.getSocketIdInLobby).toHaveBeenCalledWith(lobbyId1);
        expect(lobbyGateway.server.sockets.sockets.get).toHaveBeenCalledWith(testId);
        expect(logger.log).toHaveBeenNthCalledWith(1, logPlayerLeavingRoom(ORG_BANNED_NAME, lobbyId1));
        expect(logger.log).toHaveBeenNthCalledWith(2, logPlayerLeavingRoom('bonjour', lobbyId1));
        expect(logger.log).toHaveBeenNthCalledWith(3, logSocketLeavingRoom(socketTest2.id, lobbyId1));
        // retire le lint pour le nombre magique car on est dans les tests
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(logger.log).toHaveBeenNthCalledWith(4, logRoomDestroy(lobbyId1));
        expect(lobbyService.deleteLobby).toHaveBeenCalledWith(lobbyId1);
        expect(lobbyService.removeSocketIdFromLobby).toHaveBeenNthCalledWith(1, socketTest.id, lobbyId1);
        expect(lobbyService.removeSocketIdFromLobby).toHaveBeenNthCalledWith(2, socketTest2.id, lobbyId1);
    });

    it('deleteRoom should delete the room associate to the organizer', () => {
        socket.data = { playerName: ORG_BANNED_NAME };

        lobbyService.getSocketIdInLobby = jest.fn().mockReturnValue([socket.id]);

        lobbyGateway.server.sockets.sockets.get = jest.fn().mockReturnValue(socket);
        logger.log = jest.fn();
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.Disconnected);
            },
        } as BroadcastOperator<any, any>);

        lobbyService.deleteLobby = jest.fn();

        (lobbyGateway as any).deleteRoom(socket, lobbyId1);

        expect(lobbyService.getSocketIdInLobby).toHaveBeenCalledWith(lobbyId1);
        expect(lobbyGateway.server.sockets.sockets.get).toHaveBeenCalledWith(testId);
        expect(logger.log).toHaveBeenNthCalledWith(1, logPlayerLeavingRoom(ORG_BANNED_NAME, lobbyId1));
        expect(logger.log).toHaveBeenNthCalledWith(2, logRoomDestroy(lobbyId1));
        expect(lobbyService.deleteLobby).toHaveBeenCalledWith(lobbyId1);
    });
});

const lobbyId1 = 'abcd';
const testId = 'a234';
const socketIdTest2 = '123456';
const socketIdTest3 = '123455';
