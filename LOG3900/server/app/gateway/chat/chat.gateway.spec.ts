// retrait du lint any pour accéder aux propriétés privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmitMessageType } from '@app/app.constants';
import { ChatService } from '@app/services/chat/chat.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let service: ChatService;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    const message = { playerName: 'Jasmine', message: 'bonjour', time: '3:27pm' };

    beforeEach(async () => {
        socket = createStubInstance<Socket>(Socket);
        server = Object.assign(createStubInstance<Server>(Server), {
            sockets: {
                sockets: new Map([[socket.id, socket]]),
            },
        });
        (socket as any).id = testId;
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: ChatService, useValue: { service } },
                {
                    provide: 'SharedRooms',
                    useValue: { a234: lobbyId1 },
                },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        service = module.get<ChatService>(ChatService);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleNewMessage', () => {
        socket.data = { playerName: 'Ahmed' };
        service.checkIfPlayerCanChat = jest.fn().mockReturnValue(true);
        service.getRoomMessages = jest.fn().mockReturnValue(true);
        service.updateRoomMessages = jest.fn();
        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.RoomMessages);
                expect(data).toEqual(true);
            },
        } as BroadcastOperator<any, any>);
        gateway.handleNewMessage(socket, message);
        expect(service.getRoomMessages).toHaveBeenCalledWith(lobbyId1);
        expect(service.updateRoomMessages).toHaveBeenCalledWith(lobbyId1, message);
        expect(service.checkIfPlayerCanChat).toHaveBeenCalledWith(lobbyId1, socket.data.playerName);
    });

    it('handleRequestMessageHistory', () => {
        service.getRoomMessages = jest.fn().mockReturnValue(true);
        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.RoomMessages);
                expect(data).toEqual(true);
            },
        } as BroadcastOperator<any, any>);
        gateway.handleRequestMessageHistory(socket);
        expect(service.getRoomMessages).toHaveBeenCalledWith(lobbyId1);
    });
    it("handleToggleChatPermission should emit ToggleChatPermission to the socket with the player's name", () => {
        const playerName = 'Ahmed';
        service.getAllSocketId = jest.fn().mockReturnValue([testId]);
        server.sockets.sockets.get = jest.fn().mockReturnValue(socket);
        service.updateDisabledChatList = jest.fn();
        socket.data = { playerName };
        gateway.handleToggleChatPermission(socket, playerName);
        expect(socket.emit.calledWith(EmitMessageType.ToggleChatPermission)).toBeTruthy();
        expect(service.updateDisabledChatList).toHaveBeenCalledWith(lobbyId1, playerName);
    });
});

const lobbyId1 = 'abcd';
const testId = 'a234';
