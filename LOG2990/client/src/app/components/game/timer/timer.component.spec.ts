/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Room } from '@app/common-client/interfaces/room';
import { TimerSocketService } from '@app/services/sockets/timer/timer-socket.service';
import { Player } from '@common/classes/player';
import { TIMER_BAR } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { of } from 'rxjs';
import { TimerComponent } from './timer.component';

describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;
    let mockTimerSocketService: jasmine.SpyObj<TimerSocketService>;
    let mockRoom: Room;
    beforeEach(() => {
        mockTimerSocketService = jasmine.createSpyObj('TimerSocketService', ['connect', 'disconnect', 'handleTime']);
        mockTimerSocketService.currentTimeSubject$ = of('00:30');
        TestBed.configureTestingModule({
            declarations: [TimerComponent],
            providers: [{ provide: TimerSocketService, useValue: mockTimerSocketService }],
        });
        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component['timerSocket'] = TestBed.inject(TimerSocketService);
        mockTimerSocketService.connect.and.returnValue();
        mockRoom = {
            id: '1',
            quiz: {
                _id: '123',
                title: 'Fake Quiz',
                description: 'Fake description',
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '1',
                        text: 'Quelle est la capitale de la France?',
                        type: QuestionType.QCM,
                        points: 10,
                        choices: [
                            { text: 'Paris', isCorrect: true },
                            { text: 'Berlin', isCorrect: false },
                            { text: 'Londres', isCorrect: false },
                            { text: 'Madrid', isCorrect: false },
                        ],
                        date: new Date(),
                    },
                    {
                        _id: '2',
                        text: 'En quelle année a été déclarée la Première Guerre mondiale?',
                        type: QuestionType.QCM,
                        points: 15,
                        choices: [
                            { text: '1914', isCorrect: true },
                            { text: '1918', isCorrect: false },
                            { text: '1922', isCorrect: false },
                            { text: '1939', isCorrect: false },
                        ],
                        date: new Date(),
                    },
                ],
                duration: 30,
            },
            currentQuestionIndex: 0,
            accessCode: 'ABC1',
            listPlayers: [new Player('Alice'), new Player('Bob'), new Player('Charlie')],
            currentTime: 30,
            roundFinished: false,
            isLocked: false,
            isTesting: false,
            isPaused: false,
            questionStats: [],
            currentState: GameState.NONE,
        };
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('ngOnInit should initialize timer', () => {
        expect(mockTimerSocketService.connect).toHaveBeenCalled();
        expect(mockTimerSocketService.handleTime).toHaveBeenCalledWith(component.room);
        expect(component['timerSubscription']).toBeDefined();
        expect(component.currentTime).toBe('00:30');
    });
    describe('updateTimer', () => {
        beforeEach(() => {
            fixture = TestBed.createComponent(TimerComponent);
            component = fixture.componentInstance;
            component.room = mockRoom;
            fixture.detectChanges();
        });

        it('should update currentTime2 and progress correctly', () => {
            const testTimeLeft = '60';
            component['updateTimer'](testTimeLeft);
            expect(component['currentTimeBar']).toBe(60);
            expect(component.progress).toBeCloseTo(-100);
        });

        it('should handle zero time left correctly', () => {
            const testTimeLeft = '0';
            component['updateTimer'](testTimeLeft);
            expect(component['currentTimeBar']).toBe(0);
            expect(component.progress).toBe(TIMER_BAR);
        });

        it('should handle complete duration correctly', () => {
            const testTimeLeft = '120';
            component['updateTimer'](testTimeLeft);
            expect(component['currentTimeBar']).toBe(120);
            expect(component.progress).toBe(-300);
        });
    });

    afterEach(() => {
        fixture.destroy();
    });
});
