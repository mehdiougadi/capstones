import { TestBed } from '@angular/core/testing';
import { MockSocket } from '@app/common-client/classes/mock-socket';
import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { ChatEvents } from '@common/enum/chat.gateway.events';
import { Message } from '@common/interfaces/message';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ChatMessageSocketService } from './chat-message-socket.service';

describe('ChatMessageSocketService', () => {
    let service: ChatMessageSocketService;
    let mockMessage: Message;
    const mSocket = new Subject<Message>();

    beforeEach(() => {
        mockMessage = { author: 'Test Author', time: new Date().toString(), message: 'Test Message' };
        TestBed.configureTestingModule({});
        service = TestBed.inject(ChatMessageSocketService);
        service.socket = new MockSocket() as unknown as Socket;
        service['messageSubject'] = mSocket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should connect to socket.io server', () => {
        expect(service.socket).toBeDefined();
    });

    it('should disconnect', () => {
        const spy = spyOn(service, 'disconnect').and.callThrough();
        service.connect();
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('should connectChatToRoom', () => {
        const spy = spyOn(service.socket, 'emit');
        service.connectChatToRoom('test');
        expect(spy).toHaveBeenCalledWith('joinRoom', 'test');
        expect(service['roomId']).toEqual('test');
    });

    it('should sendMessage', () => {
        const spy = spyOn(service.socket, 'emit');
        service['roomId'] = 'test';
        service.sendMessage(mockMessage);
        expect(spy).toHaveBeenCalledWith('roomMessage', mockMessage, 'test');
        expect(service['roomId']).toEqual('test');
    });

    it('should listen for RoomMessage event and emit data', () => {
        const nextSpy = spyOn(service['messageSubject'], 'next');
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        service.listenMessage();
        service['socket'].emit(ChatEvents.RoomMessage, mockMessage);
        expect(spy).toHaveBeenCalledWith(ChatEvents.RoomMessage, jasmine.any(Function));
        expect(nextSpy).toHaveBeenCalledWith(mockMessage);
    });

    it('should listen for UpdateChatPermission event and emit data', () => {
        const nextSpy = spyOn(service['messageSubject'], 'next');
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify({ name: 'test' }));
        service.listenMessage();
        service['socket'].emit(ChatEvents.UpdateChatPermission, [mockMessage, 'test']);
        expect(spy).toHaveBeenCalledWith(ChatEvents.UpdateChatPermission, jasmine.any(Function));
        expect(nextSpy).toHaveBeenCalledWith(mockMessage);
    });

    it('should togglePlayerChatPermission', () => {
        const spy = spyOn(service.socket, 'emit');
        const mockPlayer = new Player('Alice');
        const mockRoom = { id: '1234' } as Room;
        service.togglePlayerChatPermission(mockPlayer, mockRoom);
        expect(spy).toHaveBeenCalledWith(ChatEvents.UpdateChatPermission, mockPlayer, mockRoom);
    });

    it('should send message on player leave', () => {
        const spy = spyOn(service.socket, 'emit');
        const mockPlayer = new Player('Alice');
        const mockRoom = { id: '1234' } as Room;
        service.playerLeaveMessage(mockPlayer.name, mockRoom.id);
        expect(spy).toHaveBeenCalledWith(ChatEvents.PlayerLeaveMessage, mockPlayer.name, mockRoom.id);
    });

    it('should call socket.on with an event', () => {
        const event = 'roomMessage';
        const action = (data: Message) => {
            service['messageSubject'].next(data);
        };
        const spy = spyOn(service.socket, 'on');
        service.socket.on(event, action);
        expect(spy).toHaveBeenCalledWith(event, action);
    });

    it('should return message subject', () => {
        const messageSubject = service.getMessage();
        expect(messageSubject).toBeInstanceOf(Subject);
    });
});
