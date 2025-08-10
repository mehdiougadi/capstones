import { Injectable } from '@angular/core';
import { ONE_SECOND } from '@app/app.constants';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    timerExpiredSubject = new Subject<void>();
    private interval: number;
    private time: number;
    constructor() {
        this.time = 0;
        this.interval = 0;
    }
    get timerExpired() {
        return this.timerExpiredSubject.asObservable();
    }

    startTimer(startValue: number) {
        this.stopTimer();
        this.time = startValue;

        this.interval = window.setInterval(() => {
            if (this.time > 0) {
                this.time--;
            }
            if (this.time === 0) {
                this.stopTimer();
                this.timerExpiredSubject.next();
            }
        }, ONE_SECOND);
    }

    stopTimer() {
        clearInterval(this.interval);
    }
}
