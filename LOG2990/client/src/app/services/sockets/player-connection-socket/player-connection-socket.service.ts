import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Room } from '@app/common-client/interfaces/room';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { ChatMessageSocketService } from '@app/services/sockets/chat-message-socket/chat-message-socket.service';
import { Player } from '@common/classes/player';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PlayerConnectionSocketService {
    socket: Socket;
    private gameStarted: boolean;
    constructor(
        private readonly router: Router,
        private readonly chatService: ChatMessageSocketService,
        private readonly roomManagerService: RoomManagerService,
    ) {}

    connect() {
        const serverUrlWithoutApi = environment.serverUrl.replace('/api', '');
        this.socket = io(serverUrlWithoutApi);
    }

    connectPlayerToRoom(room: Room) {
        if (room) {
            this.socket.on(`addingPlayerToRoom:${room.id}`, (player) => {
                room.listPlayers.push(player);
            });
            this.socket.on(`updatePlayerInteraction:${room.id}`, (player) => {
                this.updateInteraction(room, player);
            });
        }
    }
    connectHostToGame(room: Room) {
        if (room) {
            this.socket.emit('connectOrganisator', room.id);
        }
    }
    connectPlayerToGame(room: Room, playerName: string) {
        if (room) {
            this.socket.emit('playerConnection', { roomId: room.id, playerName });
        }
    }

    removePlayerFromRoom(room: Room) {
        if (room) {
            this.socket.on(`removingPlayerFromRoom:${room.id}`, (player, isBanned) => {
                this.updateListPlayers(room, player, isBanned);
            });
        }
    }

    banPlayerFromRoom(room: Room) {
        if (room) {
            this.socket.on(`banPlayerFromRoom:${room.id}`, (playerName: string) => {
                const currentPlayerString = sessionStorage.getItem('currentPlayer');
                if (currentPlayerString && playerName === JSON.parse(currentPlayerString).name) {
                    this.router.navigate(['home']);
                }
                room.listPlayers = room.listPlayers.filter((player) => player.name !== playerName);
            });
        }
    }

    setGameStarted(isGameStarted: boolean): void {
        this.gameStarted = isGameStarted;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    private updateListPlayers(room: Room, player: Player, isBanned: boolean): void {
        if (player !== null) {
            this.chatService.playerLeaveMessage(player.name, room.id);
            room.listPlayers = room.listPlayers.filter((p) => p.name !== player.name);
        }
        if (!isBanned && this.gameStarted) {
            player.interaction = 'black';
            room.listPlayers.push(player);
        }
        this.roomManagerService.sortCurrentPlayerList(room);
    }

    private updateInteraction(room: Room, player: Player) {
        const playerToUpdate = room.listPlayers.find((p) => p.name === player.name);
        if (playerToUpdate) {
            playerToUpdate.interaction = player.interaction;
        }
        this.roomManagerService.sortCurrentPlayerList(room);
    }
}
