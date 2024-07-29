import { PlayerTracker } from '@app/common-server/player-tracker';
import { Room } from '@app/common-server/room';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { ADMIN_NAME, LOWER_BOUND, TIME_SOCKET_INIT } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';
import { Injectable } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class PlayerTrackerGateway implements OnGatewayDisconnect {
    @WebSocketServer() private server: Server;
    private hosts: PlayerTracker[] = [];
    private players: PlayerTracker[] = [];

    constructor(private readonly gameServiceMain: GameService) {}

    @SubscribeMessage('connectOrganisator')
    connectHost(socket: Socket, roomId: string): void {
        const newHost: PlayerTracker = { username: ADMIN_NAME, socketId: socket.id, roomId };
        this.hosts.push(newHost);
    }

    @SubscribeMessage('playerConnection')
    connectPlayer(socket: Socket, data: { roomId: string; playerName: string }): void {
        const room = this.gameServiceMain.findRoomById(data.roomId);
        if (room) {
            if (room.currentState === GameState.TRANSITION) {
                this.changeStateIfAllConnected(room, data.roomId);
            }
            this.players.push({ username: data.playerName, socketId: socket.id, roomId: data.roomId });
        }
    }

    handleDisconnect(client: Socket): void {
        if (!this.processHostDisconnect(client)) {
            this.processPlayerDisconnect(client);
        }
    }

    private changeStateIfAllConnected(room: Room, roomId: string): void {
        if (room.listPlayers.length === this.players.filter((player) => player.roomId === roomId).length) {
            setTimeout(() => {
                this.gameServiceMain.changeGameState(room.id, GameState.NEXT_ROUND);
            }, TIME_SOCKET_INIT);
        }
    }

    private processHostDisconnect(client: Socket): boolean {
        const hostIndex = this.hosts.findIndex((host) => host.socketId === client.id);
        if (hostIndex !== LOWER_BOUND) {
            this.removeHostByIndex(hostIndex);
            return true;
        }
        return false;
    }

    private processPlayerDisconnect(client: Socket): void {
        const playerIndex = this.players.findIndex((player) => player.socketId === client.id);
        if (playerIndex !== LOWER_BOUND) {
            this.removePlayerByIndex(playerIndex);
        }
    }

    private removeHostByIndex(index: number): void {
        const room = this.gameServiceMain.findRoomById(this.hosts[index].roomId);
        if (room && room.currentState === GameState.BEFORE_START && room.randomMode) {
            this.hosts.splice(index, 1);
        } else {
            this.gameServiceMain.changeGameState(this.hosts.splice(index, 1)[0].roomId, GameState.END_ROOM);
        }
    }

    private removePlayerByIndex(index: number): void {
        const playerInfo = this.players[index];
        const room = this.gameServiceMain.findRoomById(playerInfo.roomId);
        if (!room || room.currentState === GameState.TRANSITION) {
            return;
        }
        this.gameServiceMain.deletePlayerFromRoom(room, playerInfo.username);
        this.players.splice(index, 1);
    }
}
