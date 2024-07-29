import { Answer } from '@common/interfaces/answer';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class GameConnectionGateway {
    @WebSocketServer()
    private server: Server;
    private socket: Socket;

    startGame(roomId: string) {
        this.server.emit(`startGameWithId:${roomId}`);
    }

    sendRoomState(roomId: string, roomState: string) {
        this.server.emit(`sendRoomState:${roomId}`, roomState);
    }

    banPlayerFromRoom(roomId: string, playerToKick: string) {
        this.server.emit(`banPlayerFromRoom:${roomId}`, playerToKick);
    }

    sendUpdatedStats(roomId: string, answer: Answer, action: number) {
        if (roomId) {
            this.socket.emit('sendStatsUpdate', answer, action);
        }
    }
}
