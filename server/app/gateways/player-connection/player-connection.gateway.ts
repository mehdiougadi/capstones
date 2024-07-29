import { Player } from '@common/classes/player';
import { Answer } from '@common/interfaces/answer';
import { QuestionStats } from '@common/interfaces/questionStats';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class PlayerConnectionGateway {
    @WebSocketServer()
    private server: Server;
    sendNewPlayerToClient(player: Player, roomId: string) {
        this.server.emit(`addingPlayerToRoom:${roomId}`, player);
    }

    sendPlayerInteraction(roomId: string, player: Player) {
        this.server.emit(`updatePlayerInteraction:${roomId}`, player);
    }

    sendLeftPlayerToClient(player: Player, roomId: string, isBanned: boolean) {
        this.server.emit(`removingPlayerFromRoom:${roomId}`, player, isBanned);
    }

    updateStats(roomId: string, answers: Answer[], currentQuestionIndex: number) {
        const roomStats = { roomId, answers, currentQuestionIndex };
        this.server.emit('updateStats', roomStats);
    }

    sendPlayersUpdate(roomId: string, players: Player[]) {
        if (roomId) {
            this.server.emit(`sendPlayersUpdate:${roomId}`, players);
        }
    }

    sendUpdatedStats(roomId: string, updatedStats: QuestionStats[]): void {
        this.server.emit(`sendUpdatedStats:${roomId}`, updatedStats);
    }
}
