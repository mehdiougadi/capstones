import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { TimerGateway } from '@app/gateways/timer/timer.gateway';
import { FOUR_REFRESH_SECOND, SAFE_TIME_ANSWERS, TIMER_REFRESH_INTERVAL } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameServiceTimer {
    constructor(
        private readonly timerGateway: TimerGateway,
        private readonly gameConnectionGateway: GameConnectionGateway,
    ) {}

    startTimerForRoom(room: Room, time: number, onComplete: () => void): void {
        this.stopTimerForRoom(room);
        room.currentTime = time;
        this.updateClientTime(room, room.currentTime);
        this.initTimer(room, TIMER_REFRESH_INTERVAL, onComplete);
    }
    startPanicTimerForRoom(room: Room, time: number, onComplete: () => void): void {
        this.stopTimerForRoom(room);
        room.currentTime = time;
        this.updateClientTime(room, room.currentTime);
        this.initTimer(room, FOUR_REFRESH_SECOND, onComplete);
    }
    startTimerFirstToAnswer(room: Room) {
        setTimeout(() => {
            room.lockPlayerPoints = true;
        }, SAFE_TIME_ANSWERS);
    }
    stopTimerForRoom(room: Room): boolean {
        if (room && room.timer && room.currentState !== GameState.BETWEEN_ROUNDS) {
            clearInterval(room.timer);
        }
        return true;
    }

    timerNextRoundManager(room: Room, isARound: boolean): string {
        if (isARound) {
            this.updateClientTime(room, 0);
            this.stopTimerForRoom(room);
            this.gameConnectionGateway.sendRoomState(room.id, GameState.SEND_ANSWERS);
            return GameState.NONE;
        } else {
            this.updateClientTime(room, 0);
            return GameState.NEXT_ROUND;
        }
    }
    updateClientTime(room: Room, time: number) {
        this.timerGateway.updateTimeForQuestion(time, room.id);
    }
    private initTimer(room: Room, interval: number, onComplete: () => void) {
        room.timer = setInterval(() => {
            if (room.currentTime > 1) {
                room.currentTime--;
                this.updateClientTime(room, room.currentTime);
            } else {
                this.finalizeTimer(room, onComplete);
            }
        }, interval);
    }

    private finalizeTimer(room: Room, onComplete: () => void) {
        clearInterval(room.timer);
        room.timer = undefined;
        onComplete();
        if (room.currentState !== GameState.NEXT_ROUND) {
            this.updateClientTime(room, 1);
        }
    }
}
