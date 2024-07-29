import { Room } from '@app/common-server/room';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { GameServicePlayer } from '@app/services/game-services/game-player-Service/game-player-service';
import { GameServiceRoom } from '@app/services/game-services/game-room-service/game-room-service';
import { Player } from '@common/classes/player';
import { GameAccess } from '@common/client-message/game-acces-pop-up';
import { GameState } from '@common/enum/socket-messages';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';

describe('RoomController', () => {
    let controller: RoomController;
    let mockGameService: Partial<GameService>;
    let mockGameServicePlayer: Partial<GameServicePlayer>;
    let mockGameServiceRoom: Partial<GameServiceRoom>;

    beforeEach(async () => {
        mockGameService = {
            createRoomMain: jest.fn(),
            getRoomIdByCode: jest.fn().mockReturnValue({ id: 'mockRoomId' }),
            getGamePlayers: jest.fn(),
            verifyPlayerAnswersMain: jest.fn(),
            findRoomById: jest.fn().mockResolvedValue({} as Room),
            changeGameState: jest.fn().mockResolvedValue(undefined),
            getGameInfo: jest.fn().mockResolvedValue({} as Room),
            deletePlayerFromRoom: jest.fn(),
            restartTimer: jest.fn(),
            stopTimer: jest.fn(),
            enablePanicMode: jest.fn(),
            verifyQrlAnswersMain: jest.fn(),
            updateListPlayers: jest.fn(),
            updateQrlInteration: jest.fn(),
        };

        mockGameServicePlayer = {
            addPlayerToRoom: jest.fn(),
            removePlayerFromRoom: jest.fn(),
            updatePlayerInteration: jest.fn(),
        };
        mockGameServiceRoom = {
            changeLockRoom: jest.fn().mockResolvedValue(undefined),
            banPlayerFromRoom: jest.fn().mockReturnValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoomController],
            providers: [
                { provide: GameService, useValue: mockGameService },
                { provide: GameServicePlayer, useValue: mockGameServicePlayer },
                { provide: GameServiceRoom, useValue: mockGameServiceRoom },
            ],
        }).compile();

        controller = module.get<RoomController>(RoomController);
    });

    describe('create', () => {
        it('should create a room and return game pin', async () => {
            const id = 'testId';
            const isTesting = true;
            const randomMode = false;
            const expectedPin = 'gamePin';

            (mockGameService.createRoomMain as jest.Mock).mockResolvedValue(expectedPin);

            const result = await controller.create(id, isTesting, randomMode);

            expect(mockGameService.createRoomMain).toHaveBeenCalledWith(id, isTesting, randomMode);
            expect(result).toEqual(expectedPin);
        });
    });

    describe('addPlayerToRoom', () => {
        it('should add player to room and return room id on success', async () => {
            const username = 'testUser';
            const accessCode = 'accessCode';
            const randomMode = 'false';
            (mockGameServicePlayer.addPlayerToRoom as jest.Mock).mockReturnValue(null);

            const result = await controller.addPlayerToRoom(username, accessCode, randomMode);

            expect(result).toEqual({ id: 'mockRoomId', msg: null });
        });

        it('should return ROOM_NOT_FOUND message when room is not found', async () => {
            const username = 'testUser';
            const accessCode = 'GameState.NONExistentCode';
            (mockGameService.getRoomIdByCode as jest.Mock).mockReturnValue(null);
            const result = await controller.addPlayerToRoom(username, accessCode, 'false');
            expect(result).toEqual({ id: null, msg: GameAccess.ROOM_NOT_FOUND });
        });
    });
    describe('getRoomById', () => {
        it('should return room details for a given ID', async () => {
            const roomId = 'testRoomId';
            const expectedRoomDetails = { id: roomId, name: 'Test Room' };

            (mockGameService.findRoomById as jest.Mock).mockResolvedValue(expectedRoomDetails);

            const result = await controller.getRoomById(roomId);

            expect(mockGameService.findRoomById).toHaveBeenCalledWith(roomId);
            expect(result).toEqual(expectedRoomDetails);
        });
    });
    describe('removePlayerToRoom', () => {
        it('should return Fail message when a player is not the last removed', async () => {
            const username = 'testUser';
            const roomId = 'testRoomId';

            (mockGameService.deletePlayerFromRoom as jest.Mock).mockReturnValue(false);

            (mockGameService.findRoomById as jest.Mock).mockReturnValue({ id: roomId, name: 'Test Room' });

            const result = await controller.removePlayerToRoom(username, roomId);

            expect(mockGameService.deletePlayerFromRoom).toHaveBeenCalled();
            expect(result).toEqual({ msg: 'FAIL' });
        });

        it('should return Sucess message when the player is not the last removed', async () => {
            const username = 'testUser';
            const roomId = 'testRoomId';

            (mockGameService.deletePlayerFromRoom as jest.Mock).mockReturnValue(true);

            (mockGameService.findRoomById as jest.Mock).mockReturnValue({ id: roomId, name: 'Test Room' });

            const result = await controller.removePlayerToRoom(username, roomId);

            expect(mockGameService.deletePlayerFromRoom).toHaveBeenCalledWith(expect.any(Object), username);
            expect(result).toEqual({ msg: 'Success' });
        });
    });

    it('startGameForRoom - should call changeGameState with GameState.BEFORE_START', async () => {
        const roomId = 'roomId';
        const body = { room: { id: roomId } };

        await controller.startGameForRoom(body);

        expect(mockGameService.changeGameState).toHaveBeenCalledWith(roomId, GameState.BEFORE_START);
    });

    it('startNextRoundForRoom - should call changeGameState with GameState.BETWEEN_ROUNDS', async () => {
        const roomId = 'roomId';
        const body = { room: { id: roomId } };

        await controller.startNextRoundForRoom(body);

        expect(mockGameService.changeGameState).toHaveBeenCalledWith(roomId, GameState.BETWEEN_ROUNDS);
    });

    it('getGameInfo - should return game information', async () => {
        const roomId = 'roomId';
        const expectedGameInfo = { id: roomId, info: 'Game Information' };
        (mockGameService.getGameInfo as jest.Mock).mockResolvedValue(expectedGameInfo as unknown);

        const result = await controller.getGameInfo(roomId);

        expect(mockGameService.getGameInfo).toHaveBeenCalledWith(roomId);
        expect(result).toEqual(expectedGameInfo);
    });
    it('should return FAIL message when the player addition fails', async () => {
        const username = 'testUsername';
        const accessCode = 'testAccessCode';
        const roomId = 'mockRoomId';
        const randomMode = 'false';
        const failMessage = 'Some failure reason';

        (mockGameServicePlayer.addPlayerToRoom as jest.Mock).mockReturnValue(failMessage);
        (mockGameService.getRoomIdByCode as jest.Mock).mockReturnValue({ id: roomId });

        const result = await controller.addPlayerToRoom(username, accessCode, randomMode);

        expect(mockGameServicePlayer.addPlayerToRoom).toHaveBeenCalledWith({ id: roomId }, username, false);
        expect(result).toEqual({ id: null, msg: failMessage });
    });
    it('should call changeLockRoom with the correct room id', async () => {
        const roomId = 'testRoomId';
        const body = { room: { id: roomId } };

        await controller.changeLockRoom(body);

        expect(mockGameService.findRoomById).toHaveBeenCalledWith(roomId);
        expect(mockGameServiceRoom.changeLockRoom).toHaveBeenCalledWith(expect.any(Object));
    });
    describe('RoomController - startRound', () => {
        it('should call changeGameState with id and GameState.NEXT_ROUND', async () => {
            const roomId = 'testRoomId';

            await controller.startRound(roomId);

            expect(mockGameService.changeGameState).toHaveBeenCalledWith(roomId, GameState.NEXT_ROUND);
        });
    });
    describe('@Post("/:id/endGame")', () => {
        it('should call changeGameState with GameState.END_GAME and return true', async () => {
            const roomId = '123';
            const response = await controller.endGame(roomId);

            expect(mockGameService.changeGameState).toHaveBeenCalledWith(roomId, GameState.END_GAME);
            expect(response).toBe(true);
        });
    });
    describe('@Get("/room/:id/players")', () => {
        it('should return a list of players for the given room ID', async () => {
            const roomId = '123';
            const mockPlayers = [{ name: 'Player1' }, { name: 'Player2' }];
            (mockGameService.getGamePlayers as jest.Mock).mockResolvedValue(mockPlayers);

            const players = await controller.getGamePlayers(roomId);

            expect(mockGameService.getGamePlayers).toHaveBeenCalledWith(roomId);
            expect(players).toEqual(mockPlayers);
        });
    });
    describe('@Post("/room/:id/verif")', () => {
        it('should verify player answers and return a boolean', async () => {
            const roomId = '123';
            const verificationData = { currentPlayer: 'Player1', answers: [{ text: 'Answer1', isCorrect: true }] };
            (mockGameService.verifyPlayerAnswersMain as jest.Mock).mockResolvedValue(true);

            const result = await controller.verifyAnswers(roomId, verificationData);

            expect(mockGameService.verifyPlayerAnswersMain).toHaveBeenCalledWith(roomId, verificationData.answers, verificationData.currentPlayer);
            expect(result).toBe(true);
        });
    });
    describe('@Post("/room/:id/qrl")', () => {
        it('should verify player qrl answers and return a boolean', async () => {
            const roomId = '123';
            const verificationData = { currentPlayer: 'Player1', qrlAnswer: 'Answer1' };
            (mockGameService.verifyQrlAnswersMain as jest.Mock).mockResolvedValue(true);

            const result = await controller.verifyQrl(roomId, verificationData);

            expect(mockGameService.verifyQrlAnswersMain).toHaveBeenCalledWith(roomId, verificationData.qrlAnswer, verificationData.currentPlayer);
            expect(result).toBe(true);
        });
    });
    describe('@Post("/room/:id/updateListPlayers")', () => {
        it('should verify player qrl answers and return a boolean', async () => {
            const roomId = '123';
            const mockPlayers = [new Player('Joe'), new Player('John')];
            const body = { roomId, listPlayers: mockPlayers };

            await controller.updateListPlayers(body);

            expect(mockGameService.updateListPlayers).toHaveBeenCalled();
        });
    });
    describe('@Post("/delete/:id")', () => {
        it('should delete the room and return true', async () => {
            const roomId = '123';
            (mockGameService.changeGameState as jest.Mock).mockResolvedValue(true);

            const result = await controller.deleteRoom(roomId);

            expect(mockGameService.changeGameState).toHaveBeenCalledWith(roomId, GameState.END_ROOM);
            expect(result).toBe(true);
        });
    });

    describe('stopTimer', () => {
        it('should call stopTimer on gameService with roomId and return true', async () => {
            const roomId = 'testRoomId';
            const result = await controller.stopTimer(roomId);
            expect(mockGameService.stopTimer).toHaveBeenCalledWith(roomId);
            expect(result).toBe(true);
        });
    });

    describe('restartTimer', () => {
        it('should call restartTimer on gameService with roomId and return true', async () => {
            const roomId = 'testRoomId';
            const result = await controller.restartTimer(roomId);
            expect(mockGameService.restartTimer).toHaveBeenCalledWith(roomId);
            expect(result).toBe(true);
        });
    });

    describe('enablePanicMode', () => {
        it('should call enablePanicMode on gameService with roomId and questionType and return true', async () => {
            const roomId = 'testRoomId';
            const result = await controller.enablePanicMode(roomId);
            expect(mockGameService.enablePanicMode).toHaveBeenCalledWith(roomId);
            expect(result).toBe(true);
        });
    });

    describe('banPlayerFromRoom', () => {
        it('should ban a player from the room', async () => {
            const player = new Player('testingName');
            const roomId = 'roomId';
            const room = { id: roomId } as undefined;

            await controller.banPlayerFromRoom({ player, room });

            expect(mockGameService.findRoomById).toHaveBeenCalledWith(roomId);
        });
    });

    describe('updatePlayerInteration', () => {
        it('should update a player interaction in the room', async () => {
            const player = new Player('testingName');
            const roomId = 'roomId';

            await controller.updatePlayerInteration({ player, roomId });

            expect(mockGameService.findRoomById).toHaveBeenCalledWith(roomId);
            expect(mockGameServicePlayer.updatePlayerInteration).toHaveBeenCalled();
        });
    });

    describe('updateQrlInteration', () => {
        it('should update a qrl interaction in the room', async () => {
            const player = new Player('testingName');
            const roomId = 'roomId';

            await controller.updateQrlInteration({ player, roomId });

            expect(mockGameService.findRoomById).toHaveBeenCalledWith(roomId);
            expect(mockGameService.updateQrlInteration).toHaveBeenCalled();
        });
    });
});
