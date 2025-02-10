import { CountDown, TIMER_DELAY, TIMER_DELAY_PANIC } from '@app/app.constants';
import { Lobby } from '@app/model/database/lobby';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class LobbyTimer {
    lobbyCountdown: EventEmitter;

    constructor(@Inject('SharedLobbies') private lobbies: { [lobby: string]: Lobby }) {
        this.lobbyCountdown = new EventEmitter();
    }

    startCountdown(lobbyId: string, countDown: CountDown): void {
        const lobby = this.lobbies[lobbyId];
        if (!lobby) {
            return;
        }
        this.stopCountdown(lobbyId);
        let countdownDuration: number;
        if (countDown === CountDown.QuestionTime) {
            countdownDuration = lobby.game.duration;
        } else {
            countdownDuration = countDown;
        }

        this.lobbyCountdown.emit('countdown', { lobbyId, countdownDuration });
        const countdownTick = () => {
            if (lobby.getIsTimerPaused()) {
                return;
            }
            countdownDuration--;
            this.lobbyCountdown.emit('countdown', { lobbyId, countdownDuration });
            if (countdownDuration <= 0) {
                clearInterval(lobby.timer);
                lobby.disablePanicMode();
                delete lobby.timer;
            }
        };

        lobby.timer = setInterval(() => {
            if (lobby.getIsPanicMode()) {
                clearInterval(lobby.timer);
                lobby.timer = setInterval(countdownTick, TIMER_DELAY_PANIC);
            } else {
                countdownTick();
            }
        }, TIMER_DELAY);
    }

    stopCountdown(lobbyId: string): void {
        const lobby = this.lobbies[lobbyId];
        if (lobby.timer) {
            clearInterval(lobby.timer);
            delete lobby.timer;
            lobby.disablePanicMode();
        }
    }

    pauseCountdown(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        if (lobby.timer) {
            lobby.setTimerPaused();
        }
    }

    unpauseCountdown(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        if (lobby.timer) {
            lobby.setTimerUnpaused();
        }
    }

    setPanicMode(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        if (lobby.timer) {
            lobby.setPanicMode();
        }
    }
}
