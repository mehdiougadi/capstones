// retrait du lint any pour accéder aux attributs privés
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { PANIC_MODE_TIME_LIMIT_QCM, QuestionState, QuestionType, SocketServerEventsSend } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';
import { TimerComponent } from './timer.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('OrganizerPageComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [TimerComponent],
            providers: [{ provide: SocketClientService, useValue: socketService }],
            imports: [MatIconModule],
        });
        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle play/pause timer', () => {
        spyOn(component as any, 'pauseCountdown');
        spyOn(component as any, 'unpauseCountdown');

        component.togglePlayPauseTimer();
        expect((component as any).isTimerPlaying).toBe(false);
        expect((component as any).pauseCountdown).toHaveBeenCalled();
        component.togglePlayPauseTimer();
        expect((component as any).isTimerPlaying).toBe(true);
        expect((component as any).unpauseCountdown).toHaveBeenCalled();
    });

    it('should get the timer playing state', () => {
        (component as any).isTimerPlaying = true;

        const result = (component as any).getIsTimerPlaying();

        expect(result).toBe(true);
    });

    it('should set panic mode', () => {
        spyOn(component.socketService, 'send');

        component.setPanicMode();

        expect(component.socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.PanicMode);
        expect((component as any).isPanicModeActivated).toBe(true);
    });

    it('should check if panic mode is available', () => {
        component.questionState = QuestionState.InQuestion;
        (component as any).isPanicModeActivated = false;
        (component as any).currentQuestion = { type: QuestionType.QCM };
        component.time = PANIC_MODE_TIME_LIMIT_QCM - 1;

        const result = component.isPanicModeAvailable();

        expect(result).toBe(true);
    });

    it('should pause countdown', () => {
        spyOn(component.socketService, 'send');

        component['pauseCountdown']();

        expect(component.socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.PauseTimer);
    });

    it('should unpause countdown', () => {
        spyOn(component.socketService, 'send');

        component['unpauseCountdown']();

        expect(component.socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.UnpauseTimer);
    });

    it('should resetPanicMode', () => {
        (component as any).isPanicModeActivated = true;
        component.resetPanicMode();

        expect((component as any).isPanicModeActivated).toEqual(false);
    });
});
