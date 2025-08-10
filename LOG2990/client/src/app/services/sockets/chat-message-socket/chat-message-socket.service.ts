import { Injectable } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { ChatEvents } from '@common/enum/chat.gateway.events';
import { Message } from '@common/interfaces/message';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ChatMessageSocketService {
    socket: Socket;
    private roomId: string;
    private messageSubject: Subject<Message> = new Subject<Message>();

    connect() {
        const serverUrlWithoutApi = environment.serverUrl.replace('/api', '');
        this.socket = io(serverUrlWithoutApi);
    }

    listenMessage() {
        this.socket.on(ChatEvents.RoomMessage, (data: Message) => {
            this.messageSubject.next(data);
        });
        this.socket.on(ChatEvents.UpdateChatPermission, (data: [Message, string]) => {
            const currentPlayerString = sessionStorage.getItem('currentPlayer');
            if (currentPlayerString && data[1] === JSON.parse(currentPlayerString).name) {
                this.messageSubject.next(data[0]);
            }
        });
    }

    togglePlayerChatPermission(player: Player, room: Room): void {
        this.socket.emit(ChatEvents.UpdateChatPermission, player, room);
    }

    getMessage(): Subject<Message> {
        return this.messageSubject;
    }

    connectChatToRoom(roomId: string) {
        this.socket.emit(ChatEvents.JoinRoom, roomId);
        this.roomId = roomId;
    }

    sendMessage(message: Message) {
        this.socket.emit(ChatEvents.RoomMessage, message, this.roomId);
    }

    playerLeaveMessage(username: string, roomId: string) {
        this.socket.emit(ChatEvents.PlayerLeaveMessage, username, roomId);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
