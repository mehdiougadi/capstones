import { Room } from '@app/common-server/room';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { GameServicePlayer } from '@app/services/game-services/game-player-Service/game-player-service';
import { Player } from '@common/classes/player';
import { BAN_MESSAGE, LEAVE_MESSAGE, SYSTEM_NAME, UNBAN_MESSAGE } from '@common/constant/constants';
import { ChatEvents } from '@common/enum/chat.gateway.events';
import { Message } from '@common/interfaces/message';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway {
    @WebSocketServer() private server: Server;
    constructor(
        private gameServicePlayer: GameServicePlayer,
        private gameService: GameService,
    ) {}

    @SubscribeMessage(ChatEvents.JoinRoom)
    joinRoom(socket: Socket, roomId: string): void {
        socket.join(roomId);
    }

    @SubscribeMessage(ChatEvents.RoomMessage)
    roomMessage(socket: Socket, message: [Message, string]): void {
        const player = this.gameServicePlayer.findPlayerByName(message[0].author, this.gameService.findRoomById(message[1]));
        if (player === null || !player.isBannedFromChat) {
            message[0].time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });
            this.server.to(message[1]).emit(ChatEvents.RoomMessage, message[0]);
        }
    }

    @SubscribeMessage(ChatEvents.UpdateChatPermission)
    updateChatPermission(socket: Socket, message: [Player, Room]): void {
        this.gameServicePlayer.togglePlayerChatPermission(message[0], this.gameService.findRoomById(message[1].id));
        const messageToSend: Message = {
            author: SYSTEM_NAME,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
            message: '',
        };
        if (message[0].isBannedFromChat) {
            messageToSend.message = BAN_MESSAGE;
        } else {
            messageToSend.message = UNBAN_MESSAGE;
        }
        this.server.to(message[1].id).emit(ChatEvents.UpdateChatPermission, [messageToSend, message[0].name]);
    }

    @SubscribeMessage(ChatEvents.PlayerLeaveMessage)
    playerLeaveMessage(socket: Socket, message: [Message, string]): void {
        this.server.to(message[1]).emit(ChatEvents.RoomMessage, {
            author: SYSTEM_NAME,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
            message: message[0] + LEAVE_MESSAGE,
        });
    }
}
