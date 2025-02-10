import { Lobby } from '@app/model/database/lobby';
import { Message } from '@app/model/database/message';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    constructor(@Inject('SharedLobbies') private lobbies: { [lobby: string]: Lobby }) {}

    updateRoomMessages(lobbyId: string, message: Message) {
        this.lobbies[lobbyId].currentMessages.push(message);
    }

    getRoomMessages(lobbyId: string): Message[] {
        if (this.lobbies[lobbyId]) {
            return this.lobbies[lobbyId].currentMessages;
        } else {
            return [];
        }
    }
    updateDisabledChatList(lobbyId: string, player: string) {
        if (!this.lobbies[lobbyId].disabledChatList.includes(player)) {
            this.lobbies[lobbyId].disabledChatList.push(player);
        } else {
            this.lobbies[lobbyId].disabledChatList = this.lobbies[lobbyId].disabledChatList.filter((name) => name !== player);
        }
    }
    checkIfPlayerCanChat(lobbyId: string, player: string): boolean {
        return !this.lobbies[lobbyId].disabledChatList.includes(player);
    }
    getAllSocketId(lobbyId: string): string[] {
        return this.lobbies[lobbyId].sockets;
    }
}
