import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { GameState } from '@common/enum/socket-messages';
import { Injectable } from '@nestjs/common';
@Injectable()
export class GameServiceState {
    constructor(private readonly gameConnectionGateway: GameConnectionGateway) {}
    nextRoundState(room: Room): boolean {
        this.emitStartGame(room);
        room.roundFinished = false;
        room.currentState = GameState.NEXT_ROUND;
        room.lockPlayerPoints = false;

        return true;
    }
    endRoundState(room: Room): void {
        room.currentState = GameState.END_ROUND;
        room.currentQuestionIndex++;
        room.roundFinished = true;
        if (room.currentQuestionIndex < room.quiz.questions.length) {
            room.currentTime = room.quiz.duration;
        }
    }

    private emitStartGame(room: Room) {
        if (room.currentQuestionIndex === 0) {
            this.gameConnectionGateway.startGame(room.id);
        }
    }
}
