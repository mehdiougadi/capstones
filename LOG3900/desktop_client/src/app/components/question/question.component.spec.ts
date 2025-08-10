import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FIVE_SECOND, QuestionState, QuestionType, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Choice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { TimeService } from '@app/services/timer/timer.service';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { QuestionComponent } from './question.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('QuestionComponent', () => {
    let component: QuestionComponent;
    let fixture: ComponentFixture<QuestionComponent>;
    let eventsObservable: Subject<void>;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        eventsObservable = new Subject<void>();

        TestBed.configureTestingModule({
            declarations: [QuestionComponent],
            providers: [{ provide: SocketClientService, useValue: socketService }],
            imports: [FormsModule],
        });

        fixture = TestBed.createComponent(QuestionComponent);
        component = fixture.componentInstance;

        component.submittedVariableOnChange = eventsObservable;
        component.question = getFakeQuestion();

        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call ModifyQuestion when timer expires', () => {
        const timeService = TestBed.inject(TimeService);
        spyOn(timeService.timerExpiredSubject, 'subscribe').and.callThrough();
        spyOn(socketService, 'send');
        timeService.timerExpiredSubject.next();

        expect(component.modifyingQuestion).toBeFalse();
        expect(socketService.send).toHaveBeenCalledOnceWith(SocketServerEventsSend.ModifyQuestion, false);
    });

    it('should call submitAnswer when timer is 0 and questionState is InQuestion', () => {
        spyOn(component, 'submitAnswer');
        component.questionState = QuestionState.InQuestion;

        component.ngOnChanges({
            timer: new SimpleChange(1, 0, false),
        });

        expect(component.submitAnswer).toHaveBeenCalled();
    });

    it('toggleAnswer() should change the state of selected and send NewDeselection if false', () => {
        const testChoice: Choice = { text: 'test', isCorrect: false, selected: true };
        spyOn(socketService, 'send');
        component.toggleAnswer(testChoice, 1);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NewDeselection, 2);
    });

    it('toggleAnswer() should change the state of selected and send NewSelection if true', () => {
        const testChoice: Choice = { text: 'test', isCorrect: false, selected: false };
        spyOn(socketService, 'send');
        component.toggleAnswer(testChoice, 1);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NewSelection, 2);
    });

    it('should call toggleAnswer when a numeric key is pressed and questionState is InQuestion', () => {
        spyOn(component, 'toggleAnswer');
        component.questionState = QuestionState.InQuestion;

        component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '1' }));

        expect(component.toggleAnswer).toHaveBeenCalledWith(component.question.choices[0], 0);
    });

    it('should emit getAnswerEvent when Enter key is pressed', () => {
        spyOn(component.getAnswerEvent, 'emit');

        component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        expect(component.getAnswerEvent.emit).toHaveBeenCalledWith({ answer: component.question.choices, timerExpired: false });
    });

    it('getAnswer() should return all the choice of the question for a QCM', () => {
        const answer = component.getAnswer();

        expect(answer).toEqual(component.question.choices);
    });

    it('getAnswer() should return the input string for a QRL', () => {
        component.question.type = QuestionType.QRL;
        const answer = component.getAnswer();

        expect(answer).toEqual(component.inputAnswer);
    });

    it('listenCountdown() should call submitAnswer if the timer = 0', () => {
        component.questionState = QuestionState.InQuestion;
        spyOn(component, 'submitAnswer');
        component.listenCountdown();
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, 0);

        expect(component.submitAnswer).toHaveBeenCalled();
    });

    it('should modify answer when modifying question is false', () => {
        component.modifyingQuestion = false;
        spyOn(socketService, 'send');
        const timeService = TestBed.inject(TimeService);
        spyOn(timeService, 'startTimer');

        component.modifyAnswer();

        expect(component.modifyingQuestion).toBe(true);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.ModifyQuestion, true);
        expect(timeService.startTimer).toHaveBeenCalledWith(FIVE_SECOND);
    });

    it('should not modify answer when modifying question is true', () => {
        component.modifyingQuestion = true;
        spyOn(socketService, 'send');
        const timeService = TestBed.inject(TimeService);
        spyOn(timeService, 'startTimer');

        component.modifyAnswer();

        expect(component.modifyingQuestion).toBe(true);
        expect(socketService.send).not.toHaveBeenCalled();
        expect(timeService.startTimer).toHaveBeenCalledWith(FIVE_SECOND);
    });

    it('should submit the answer correctly', () => {
        const choice1: Choice = { text: 'Option 1', isCorrect: true, selected: true };
        const choice2: Choice = { text: 'Option 2', isCorrect: false, selected: true };
        component.question = {
            text: 'Sample Question',
            choices: [choice1, choice2],
            points: 10,
            type: QuestionType.QCM,
        };
        spyOn(component.getAnswerEvent, 'emit');

        component.submitAnswer();
        expect(component.getAnswerEvent.emit).toHaveBeenCalledWith({ answer: component.question.choices, timerExpired: false });
    });
});

const getFakeQuestion = (): Question => ({
    text: getRandomString(),
    points: 10,
    type: QuestionType.QCM,
    choices: [
        { text: 'choice1', isCorrect: true },
        { text: 'choice2', isCorrect: false },
    ],
});

const BASE_36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);
