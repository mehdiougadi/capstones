import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockSocket } from '@app/common-client/classes/mock-socket';
import { Room } from '@app/common-client/interfaces/room';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { ChatMessageSocketService } from '@app/services/sockets/chat-message-socket/chat-message-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { Socket } from 'socket.io-client';

describe('PlayerConnectionSocketService', () => {
    let service: PlayerConnectionSocketService;
    let mockChatService: ChatMessageSocketService;
    let mockRoomService: RoomManagerService;

    beforeEach(() => {
        const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [RoomManagerService, { provide: MatDialog, useValue: matDialogSpy }],
        });
        service = TestBed.inject(PlayerConnectionSocketService);
        mockChatService = TestBed.inject(ChatMessageSocketService);
        mockRoomService = TestBed.inject(RoomManagerService);
        service.socket = new MockSocket() as unknown as Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should connect', () => {
        const spy = spyOn(service, 'connect').and.callThrough();
        service.connect();
        expect(spy).toHaveBeenCalled();
    });

    it('should connect host to game', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        room.listPlayers = [];
        service.connect();
        const spy = spyOn(service, 'connectHostToGame').and.callThrough();
        service.connectHostToGame(room);
        expect(spy).toHaveBeenCalledWith(room);
    });

    it('should connect player to room', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        room.listPlayers = [];
        const mockPlayer = new Player('TestingName');
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        service.connectPlayerToRoom(room);
        service['socket'].emit(`addingPlayerToRoom:${room.id}`, mockPlayer);
        expect(room.listPlayers.length).toBe(1);
        expect(room.listPlayers[0]).toEqual(mockPlayer);
        expect(spy).toHaveBeenCalledWith(`addingPlayerToRoom:${room.id}`, jasmine.any(Function));
    });

    it('should update player interaction', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const mockPlayer = new Player('TestingName');
        mockPlayer.interaction = 'red';
        room.listPlayers = [mockPlayer];
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        service.connectPlayerToRoom(room);
        mockPlayer.interaction = 'yellow';
        service['socket'].emit(`updatePlayerInteraction:${room.id}`, mockPlayer);
        expect(room.listPlayers[0].interaction).toEqual(mockPlayer.interaction);
        expect(spy).toHaveBeenCalledWith(`updatePlayerInteraction:${room.id}`, jasmine.any(Function));
    });

    it('should connect player to game', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const playerName = 'Player1';
        const spy = spyOn(service, 'connectPlayerToGame').and.callThrough();
        service.connect();
        service.connectPlayerToGame(room, playerName);
        expect(spy).toHaveBeenCalledWith(room, playerName);
    });

    it('should remove player from room', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        room.listPlayers = [new Player('Player 1'), new Player('Player 2'), new Player('Player 3')];
        const playerToRemove = room.listPlayers[1];
        const isBanned = false;
        service['gameStarted'] = false;
        const spyMessage = spyOn(mockChatService, 'playerLeaveMessage');
        const spySort = spyOn(mockRoomService, 'sortCurrentPlayerList');
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        service.removePlayerFromRoom(room);
        service['socket'].emit(`removingPlayerFromRoom:${room.id}`, playerToRemove, isBanned);
        expect(room.listPlayers.length).toBe(2);
        expect(room.listPlayers).not.toContain(playerToRemove);
        expect(spyMessage).toHaveBeenCalled();
        expect(spySort).toHaveBeenCalledOnceWith(room);
        expect(spy).toHaveBeenCalledWith(`removingPlayerFromRoom:${room.id}`, jasmine.any(Function));
    });

    it('should change interaction of a player leaving during game', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        room.listPlayers = [new Player('Player 1'), new Player('Player 2'), new Player('Player 3')];
        const playerToRemove = room.listPlayers[1];
        const isBanned = false;
        service['gameStarted'] = true;
        const spyMessage = spyOn(mockChatService, 'playerLeaveMessage');
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        service.removePlayerFromRoom(room);
        service['socket'].emit(`removingPlayerFromRoom:${room.id}`, playerToRemove, isBanned);
        expect(room.listPlayers.length).toBe(3);
        expect(room.listPlayers).toContain(playerToRemove);
        expect(room.listPlayers[1].interaction).toEqual('black');
        expect(spyMessage).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(`removingPlayerFromRoom:${room.id}`, jasmine.any(Function));
    });

    it('should ban player from room', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const playerTest = new Player('test name');
        room.listPlayers = [playerTest];
        spyOn(service['socket'], 'on').and.callThrough();
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify({ name: playerTest.name }));
        const routerSpy = spyOn(service['router'], 'navigate');

        service.banPlayerFromRoom(room);
        service['socket'].emit(`banPlayerFromRoom:${room.id}`, playerTest.name);

        expect(routerSpy).toHaveBeenCalledWith(['home']);
    });

    it('should setGameStarted', () => {
        service['gameStarted'] = false;
        service.setGameStarted(true);
        expect(service['gameStarted']).toBeTrue();
    });

    it('should disconnect', () => {
        const spy = spyOn(service, 'disconnect').and.callThrough();
        service.connect();
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });
});
