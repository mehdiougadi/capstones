import { Answer } from '@app/model/database/answer';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { QuestionStats } from '@common/interfaces/questionStats';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway()
export class UpdateStatsGateway {
    @WebSocketServer()
    private server: Server;
    constructor(private readonly gameService: GameService) {}

    @SubscribeMessage('sendStatsUpdate')
    sendStatsUpdate(socket: Socket, message: [string, Answer, number]): void {
        const room = this.gameService.updateStatsSelectedOptions(message[0], message[1], message[2]);
        if (room) {
            this.sendUpdatedStats(message[0], room.questionStats);
        }
    }

    sendUpdatedStats(roomId: string, updatedStats: QuestionStats[]): void {
        this.server.emit(`sendUpdatedStats:${roomId}`, updatedStats);
    }
}
