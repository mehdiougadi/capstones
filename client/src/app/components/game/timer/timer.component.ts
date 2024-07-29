import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { TimerSocketService } from '@app/services/sockets/timer/timer-socket.service';
import { TIMER_BAR } from '@common/constant/constants';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
    @Input() room: Room;
    currentTime: string;
    progress: number = 0;
    private timerSubscription: Subscription;
    private currentTimeBar: number = 0;
    constructor(private timerSocket: TimerSocketService) {}

    ngOnInit(): void {
        this.timerSocket.connect();
        this.timerSubscription?.unsubscribe();
        this.timerSubscription = this.timerSocket.currentTimeSubject$.subscribe((time: string) => {
            this.currentTime = time;
            this.updateTimer(time);
        });
        this.timerSocket.handleTime(this.room);
    }
    ngOnDestroy(): void {
        this.timerSubscription?.unsubscribe();
        this.currentTime = '';
        this.timerSocket?.disconnect();
    }
    private updateTimer(timeLeft: string): void {
        const timeAsNumber = Number(timeLeft);
        this.currentTimeBar = timeAsNumber;
        this.progress = TIMER_BAR - (this.currentTimeBar / this.room.quiz.duration) * TIMER_BAR;
    }
}
