import { EmitMessageType, SubscribeMessageType } from '@app/app.constants';
import { Message } from '@app/model/database/message';
import { ChatService } from '@app/services/chat/chat.service';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer() server: Server;

    constructor(
        @Inject('SharedRooms') private rooms: { [key: string]: string },
        private chatService: ChatService,
    ) {}

    @SubscribeMessage(SubscribeMessageType.NewMessage)
    handleNewMessage(client: Socket, message: Message) {
        const lobbyId = this.rooms[client.id];
        message.time = new Date().toLocaleString('fr-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
        if (this.chatService.checkIfPlayerCanChat(lobbyId, client.data.playerName)) {
            this.chatService.updateRoomMessages(lobbyId, message);
            this.server.to(lobbyId).emit(EmitMessageType.RoomMessages, this.chatService.getRoomMessages(lobbyId));
        }
    }

    @SubscribeMessage(SubscribeMessageType.RequestMessageHistory)
    handleRequestMessageHistory(client: Socket) {
        const lobbyId = this.rooms[client.id];
        client.emit(EmitMessageType.RoomMessages, this.chatService.getRoomMessages(lobbyId));
    }

    @SubscribeMessage(SubscribeMessageType.ToggleChatPermission)
    handleToggleChatPermission(client: Socket, player: string) {
        const lobbyId: string = this.rooms[client.id];
        const socketsId = this.chatService.getAllSocketId(lobbyId);
        for (const id of socketsId) {
            const socket: Socket = this.server.sockets.sockets.get(id);
            if (socket.data.playerName === player) {
                socket.emit(EmitMessageType.ToggleChatPermission);
            }
        }

        this.chatService.updateDisabledChatList(lobbyId, player);
    }
}
