/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Room } from '@app/common-client/interfaces/room';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { Player } from '@common/classes/player';
import { OrganizerMessage } from '@common/client-message/organizer-game-pop-up';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Subject } from 'rxjs';
import { QrlAnswerComponent } from './qrl-answer.component';

describe('QrlAnswerComponent', () => {
    let component: QrlAnswerComponent;
    let fixture: ComponentFixture<QrlAnswerComponent>;
    let dialog: MatDialog;
    let mockRoom: Room;
    let gameConnectionSocketSpy: jasmine.SpyObj<GameConnectionSocketService>;
    const gameSubject = new Subject<string>();
    beforeEach(async () => {
        gameConnectionSocketSpy = jasmine.createSpyObj(
            'GameConnectionSocketService',
            ['connect', 'disconnect', 'connectToGameStage', 'connectHostToGame', 'connectPlayersToGame'],
            { gameStageSubject$: gameSubject },
        );
        await TestBed.configureTestingModule({
            declarations: [QrlAnswerComponent],
            imports: [MatDialogModule, HttpClientModule, FormsModule, BrowserAnimationsModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: {
                        open: () => {},
                    },
                },
                { provide: GameConnectionSocketService, useValue: gameConnectionSocketSpy },
            ],
        }).compileComponents();

        dialog = TestBed.inject(MatDialog);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QrlAnswerComponent);
        component = fixture.componentInstance;

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
            currentState: GameState.END_ROUND,
        };

        component.currentRoom = mockRoom;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should call finishGame ', () => {
        component['subscribeRoomState']();
        spyOn<any>(component, 'handleGameState');
        gameSubject.next(GameState.END_GAME);
        expect(component['handleGameState']).toHaveBeenCalled();
    });
    it('should add score and disable button when grades are valid', () => {
        component['isGradesValid'] = true;

        const addScoreSpy = spyOn(component as any, 'addScore').and.callThrough();

        component.confirmAnswers();

        expect(addScoreSpy).toHaveBeenCalled();
        expect(component.currentIndex).toBe(0);
    });

    it('should set isGradesValid to true when valid grades are entered', () => {
        const inputElements = fixture.debugElement.queryAll(By.css('table.qrl-table input[type="number"]'));
        inputElements.forEach((input) => {
            const inputElement = input.nativeElement;
            inputElement.value = '1';
            inputElement.dispatchEvent(new Event('input'));
        });

        component['verifyGrades']();

        expect(component['isGradesValid']).toBe(true);
    });

    it('should open dialog with missing grade message when NaN is entered', () => {
        const inputElement = fixture.debugElement.query(By.css('table.qrl-table input[type="number"]')).nativeElement;
        inputElement.value = 'not a number';
        inputElement.dispatchEvent(new Event('input'));

        const dialogOpenSpy = spyOn(dialog, 'open');

        component['verifyGrades']();

        expect(dialogOpenSpy).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message: OrganizerMessage.MISSING_GRADE },
        });
    });

    it('should open dialog with wrong grade message when invalid grade is entered', () => {
        const inputElement = fixture.debugElement.query(By.css('table.qrl-table input[type="number"]')).nativeElement;
        inputElement.value = '20';
        inputElement.dispatchEvent(new Event('input'));

        const dialogOpenSpy = spyOn(dialog, 'open');

        component['verifyGrades']();

        expect(dialogOpenSpy).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message: OrganizerMessage.WRONG_GRADE },
        });
    });

    it('should disable button and reset QRL table when GameState is NEXT_ROUND', () => {
        const nextState = GameState.NEXT_ROUND;

        const resetQrlTableSpy = spyOn<any>(component, 'resetQrlTable');

        component['handleGameState'](nextState);

        expect(resetQrlTableSpy).toHaveBeenCalled();
    });

    it('should enable button when GameState is NEXT_ROUND', () => {
        const nextState = GameState.NEXT_ROUND;

        const resetQrlTable = spyOn<any>(component, 'resetQrlTable').and.callThrough();

        component['handleGameState'](nextState);

        expect(resetQrlTable).toHaveBeenCalled();
    });

    it('should unsubscribe from gameStageSubscription on component destruction', () => {
        component.ngOnDestroy();
        expect(component['subscriptions'].gameStageSubscription?.closed).toBeTrue();
    });
});
