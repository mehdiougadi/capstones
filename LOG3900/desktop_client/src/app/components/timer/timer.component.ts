import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PANIC_MODE_TIME_LIMIT_QCM, PANIC_MODE_TIME_LIMIT_QRL, QuestionState, QuestionType, SocketServerEventsSend } from '@app/app.constants';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
    @Input() currentQuestionType: QuestionType;
    @Input() questionState: QuestionState;
    @Input() time: number;
    questionStateEnum: typeof QuestionState;
    private isTimerPlaying: boolean;
    private isPanicModeActivated: boolean;

    constructor(public socketService: SocketClientService) {
        this.isTimerPlaying = true;
        this.isPanicModeActivated = false;
        this.questionStateEnum = QuestionState;
    }

    ngOnInit(): void {
        return;
    }

    ngOnDestroy(): void {
        this.socketService.socket.removeAllListeners();
    }

    resetPanicMode() {
        this.isPanicModeActivated = false;
    }

    togglePlayPauseTimer() {
        if (this.isTimerPlaying) {
            this.pauseCountdown();
        } else {
            this.unpauseCountdown();
        }
        this.isTimerPlaying = !this.isTimerPlaying;
    }
    getIsTimerPlaying(): boolean {
        return this.isTimerPlaying;
    }
    setPanicMode(): void {
        this.socketService.send(SocketServerEventsSend.PanicMode);
        this.isPanicModeActivated = true;
    }
    isPanicModeAvailable(): boolean {
        const isPanicModeLimit =
            this.currentQuestionType === QuestionType.QCM ? this.time <= PANIC_MODE_TIME_LIMIT_QCM : this.time <= PANIC_MODE_TIME_LIMIT_QRL;
        return this.questionState === QuestionState.InQuestion && !this.isPanicModeActivated && isPanicModeLimit;
    }

    private pauseCountdown(): void {
        this.socketService.send(SocketServerEventsSend.PauseTimer);
    }

    private unpauseCountdown(): void {
        this.socketService.send(SocketServerEventsSend.UnpauseTimer);
    }
}
