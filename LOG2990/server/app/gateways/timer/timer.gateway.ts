import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class TimerGateway {
    @WebSocketServer()
    private server: Server;

    updateTimeForQuestion(time: number, roomId: string): void {
        this.server.emit(`countdownUpdate:${roomId}`, time);
    }
}
