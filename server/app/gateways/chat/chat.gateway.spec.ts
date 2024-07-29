import { Room } from '@app/common-server/room';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { GameServicePlayer } from '@app/services/game-services/game-player-Service/game-player-service';
import { Player } from '@common/classes/player';
import { ChatEvents } from '@common/enum/chat.gateway.events';
import { Message } from '@common/interfaces/message';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let mockGameService: Partial<GameService>;
    let mockGameServicePlayer: Partial<GameServicePlayer>;

    beforeEach(async () => {
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        mockGameService = {
            findRoomById: jest.fn().mockResolvedValue({} as Room),
        };

        mockGameServicePlayer = {
            togglePlayerChatPermission: jest.fn(),
            findPlayerByName: jest.fn().mockResolvedValue({} as Player),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: GameService, useValue: mockGameService },
                { provide: GameServicePlayer, useValue: mockGameServicePlayer },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        // We want to assign a value to the private field
        // eslint-disable-next-line dot-notation
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('joinRoom() should join the socket room', () => {
        gateway.joinRoom(socket, '1234');
        expect(socket.join.calledOnce).toBeTruthy();
    });

    it('roomMessage() should send message if socket in the room', () => {
        stub(socket, 'rooms').value(new Set(['test']));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(ChatEvents.RoomMessage);
            },
        } as BroadcastOperator<unknown, unknown>);
        const messageToSend: Message = {
            author: 'système',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: ' peut écrire dans le chat',
        };
        gateway.roomMessage(socket, [messageToSend, '1234']);
        expect(mockGameServicePlayer.findPlayerByName).toHaveBeenCalled();
        expect(server.emit.calledWith(ChatEvents.RoomMessage, messageToSend));
    });

    it('updateChatPermission() should send unban message if socket in the room', () => {
        stub(socket, 'rooms').value(new Set(['test']));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(ChatEvents.UpdateChatPermission);
            },
        } as BroadcastOperator<unknown, unknown>);
        const player = { name: 'Alice', isBannedFromChat: false } as Player;
        const room = { id: '1234' } as Room;
        gateway.updateChatPermission(socket, [player, room]);
        expect(mockGameServicePlayer.togglePlayerChatPermission).toHaveBeenCalled();
        expect(
            server.emit.calledWith(ChatEvents.UpdateChatPermission, [
                {
                    author: 'système',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
                    message: 'Vous pouvez écrire dans le clavardage',
                },
                player.name,
            ]),
        );
    });

    it('updateChatPermission() should send ban message if socket in the room', () => {
        stub(socket, 'rooms').value(new Set(['test']));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(ChatEvents.UpdateChatPermission);
            },
        } as BroadcastOperator<unknown, unknown>);
        const player = { name: 'Alice', isBannedFromChat: true } as Player;
        const room = { id: '1234' } as Room;
        gateway.updateChatPermission(socket, [player, room]);
        expect(mockGameServicePlayer.togglePlayerChatPermission).toHaveBeenCalled();
        expect(
            server.emit.calledWith(ChatEvents.UpdateChatPermission, [
                {
                    author: 'système',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
                    message: 'Vous avez été banni du clavardage',
                },
                player.name,
            ]),
        );
    });

    it('playerLeaveMessage() should send message if socket in the room', () => {
        stub(socket, 'rooms').value(new Set(['test']));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(ChatEvents.RoomMessage);
            },
        } as BroadcastOperator<unknown, unknown>);
        const messageToSend: Message = {
            author: 'système',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
            message: 'test' + ' peut écrire dans le chat',
        };
        gateway.playerLeaveMessage(socket, [messageToSend, 'test']);
        expect(server.emit.calledWith(ChatEvents.RoomMessage, messageToSend));
    });
});
