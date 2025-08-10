// retrait du lint any pour accéder aux propriétés privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ERROR_NAME_ALREADY_EXIST,
    ERROR_NAME_CANT_BE_EMPTY,
    ERROR_NAME_IS_BAN,
    LOBBY_IS_CLOSE,
    LOBBY_NOT_EXISTING,
    ORG_BANNED_NAME,
} from '@app/app.constants';
import { Player } from '@app/model/database/player';
import { GameService } from '@app/services/game/game.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
    let service: LobbyService;
    let gameService: SinonStubbedInstance<GameService>;
    const gameTest = {
        id: 'a234',
        title: 'bonjour',
        description: 'bonjour',
        lastModification: '',
        duration: 10,
        questions: [],
        isVisible: true,
    };

    beforeEach(async () => {
        gameService = createStubInstance<GameService>(GameService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: GameService,
                    useValue: gameService,
                },
                {
                    provide: 'SharedLobbies',
                    useValue: {},
                },
                LobbyService,
            ],
        }).compile();

        service = module.get<LobbyService>(LobbyService);
        (service as any).lobbies = {
            abcd: {
                lobbyId: lobbyId1,
                players: new Map([
                    ['player1', new Player('player1', testId)],
                    ['player2', new Player('player2', socketIdTest2)],
                ]),
                nameBan: [ORG_BANNED_NAME],
                isOpen: true,
                game: gameTest,
                dateStart: '',
                sockets: [testId, socketIdTest2],
                inGame: true,
            },
            aaaa: {
                lobbyId: lobbyId2,
                players: new Map([
                    ['player3', new Player('player3', socketIdTest3)],
                    ['player4', new Player('player4', socketIdTest4)],
                ]),
                nameBan: [ORG_BANNED_NAME],
                isOpen: true,
                game: gameTest,
                dateStart: '',
                sockets: [],
                inGame: false,
            },
        };
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('createLobby() should create a lobby', async () => {
        const gameId = 'testGameId';
        const lobbyId = 'testLobbyId';

        gameService.getGame.returns(Promise.resolve(gameTest));
        jest.spyOn(service as any, 'generateRandomLobbyId').mockReturnValue(lobbyId);

        await service.createLobby(gameId);

        expect((service as any).lobbies[lobbyId]).toBeDefined();
        expect((service as any).lobbies[lobbyId].game).toBe(gameTest);
    });

    it('createLobby() should handle errors', async () => {
        const gameId = 'testGameId';

        gameService.getGame.returns(Promise.reject(new Error('Test error')));
        expect(service.createLobby(gameId)).rejects.toThrow('Test error');
    });

    it('should be able to delete a lobby', () => {
        service.deleteLobby(lobbyId1);
        expect((service as any).lobbies[lobbyId1]).toBeUndefined();
    });

    it('should add a player to a lobby', () => {
        const playerName = 'player3';

        service.addPlayerToLobby(lobbyId1, playerName, testId);

        expect((service as any).lobbies[lobbyId1].players.has(playerName)).toBe(true);
    });

    it('should delete a player from a lobby', () => {
        expect((service as any).lobbies[lobbyId1].players.get('player1').name).toBe('player1');

        service.deletePlayerFromLobby(lobbyId1, 'player1');

        expect((service as any).lobbies[lobbyId1].players.has('player1')).toBe(false);
    });

    it('should get players from a lobby', () => {
        const players: string[] = service.getPLayersFromLobby(lobbyId1);

        expect(players).toEqual(['player1', 'player2']);
    });

    it('checkPlayerName() should return error message if player name exists in the lobby', () => {
        const result = service.checkPlayerName(lobbyId1, 'PLayer1');
        expect(result).toBe(ERROR_NAME_ALREADY_EXIST);
    });

    it('checkPlayerName() should return error message if player name is banned', () => {
        const result = service.checkPlayerName(lobbyId1, 'OrGanisateur');
        expect(result).toBe(ERROR_NAME_IS_BAN);
    });

    it('checkPlayerName() should return error message if player name is undefined', () => {
        const result = service.checkPlayerName(lobbyId1, undefined);
        expect(result).toBe(ERROR_NAME_CANT_BE_EMPTY);
    });

    it('checkPlayerName() should return empty string if player name is new and not banned', () => {
        const result = service.checkPlayerName(lobbyId1, 'David');
        expect(result).toBe('');
    });

    it('checkIfJoinable() should return nothing if the room exist', () => {
        const result = service.checkIfJoinable(lobbyId1);
        expect(result).toBe('');
    });
    it('checkIfJoinable() should return a message if the room is close', () => {
        (service as any).lobbies[lobbyId1].isLocked = true;
        const result = service.checkIfJoinable(lobbyId1);
        expect(result).toBe(LOBBY_IS_CLOSE);
    });

    it("checkIfJoinable() should return a message if the room doesn't exist", () => {
        const result = service.checkIfJoinable('4a83');
        expect(result).toBe(LOBBY_NOT_EXISTING);
    });

    it('lockLobby() should change the lock value', () => {
        service.lockLobby(lobbyId1, true);
        expect((service as any).lobbies[lobbyId1].isLocked).toEqual(true);
    });

    it('getGameIdFromLobby() should get the game id from the lobby', () => {
        const result = service.getGameIdFromLobby(lobbyId1);
        expect(result).toEqual(testId);
    });

    it('addBannedPlayer() should add the ban player to the list', () => {
        const result = service.addBannedPlayer(lobbyId1, 'player2');
        expect(result).toEqual(socketIdTest2);
    });

    it('getSocketIdInLobby() should get the socket id', () => {
        const result = service.getSocketIdInLobby(lobbyId1);
        expect(result).toEqual([testId, socketIdTest2]);
    });

    it('addSocketToLobby() should add the socket id to the lobby', () => {
        service.addSocketToLobby(lobbyId2, testId);
        expect((service as any).lobbies[lobbyId2].sockets).toEqual([testId]);
    });

    it('should set inGame to true for a lobby', () => {
        service.setInGame(lobbyId2);

        expect(service.isInGame(lobbyId2)).toBe(true);
    });

    it('should return false for isInGame if setInGame has not been called', () => {
        expect(service.isInGame(lobbyId2)).toBe(false);
    });

    it('should return false for isInGame if setInGame has not been called', () => {
        expect(service.isInGame(lobbyId2)).toBe(false);
    });

    it('should remove socket id from lobby', () => {
        service.removeSocketIdFromLobby(testId, lobbyId1);

        expect((service as any).lobbies[lobbyId1].sockets).toEqual([socketIdTest2]);
    });
});

const lobbyId1 = 'abcd';
const lobbyId2 = 'aaaa';
const testId = 'a234';
const socketIdTest2 = '123456';
const socketIdTest3 = '123455';
const socketIdTest4 = '123454';
