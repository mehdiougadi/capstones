/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
    DISCONNECTED_POPUP,
    GameMode,
    ORGANIZER_LEFT_POPUP,
    POPUP_WARNING,
    QuestionState,
    QuestionType,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
} from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Points } from '@app/interfaces/answer-points';
import { AnswerSubmit } from '@app/interfaces/answer-submit';
import { Question } from '@app/interfaces/question';
import { GameService } from '@app/services/game/game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';
import { ErrorPopupComponent } from '../error-popup/error-popup.component';
import { QuestionComponent } from '../question/question.component';
import { PlayAreaComponent } from './play-area.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let questionComponent: jasmine.SpyObj<QuestionComponent>;
    const dialogMock = {
        open: jasmine.createSpy('open'),
    };
    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
    };

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getGameAdmin']);
        questionComponent = jasmine.createSpyObj('QuestionComponent', ['getAnswer']);

        TestBed.configureTestingModule({
            declarations: [PlayAreaComponent, QuestionComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: dialogMock },
                { provide: SocketClientService, useValue: socketService },
            ],
        });

        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        component.questionComponent = questionComponent;
    });

    afterEach(() => {
        dialogMock.open.calls.reset();
        mockRouter.navigate.calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should not call the function if the room id is undefined and GameMode = Player', () => {
        component.gameMode = GameMode.Player;
        spyOn(component, 'listenNewQuestion');
        spyOn(component, 'listenCountDown');
        spyOn(component, 'listenShowAnswer');
        spyOn(component, 'listenPoints');
        spyOn(component, 'requestFirstQuestion');
        spyOn(component, 'listenForNavigateResults');
        spyOn(component, 'handleDisconnect');
        spyOn(socketService, 'send');

        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, undefined);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestRoomId);
        expect(component.listenNewQuestion).not.toHaveBeenCalled();
        expect(component.listenCountDown).not.toHaveBeenCalled();
        expect(component.listenShowAnswer).not.toHaveBeenCalled();
        expect(component.listenPoints).not.toHaveBeenCalled();
        expect(component.requestFirstQuestion).not.toHaveBeenCalled();
        expect(component.listenForNavigateResults).not.toHaveBeenCalled();
        expect(component.handleDisconnect).not.toHaveBeenCalled();
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: DISCONNECTED_POPUP } });
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('ngOnInit should not call the function if the room id is undefined and GameMode = Test', () => {
        component.gameMode = GameMode.Test;
        spyOn(component, 'listenNewQuestion');
        spyOn(component, 'listenCountDown');
        spyOn(component, 'listenShowAnswer');
        spyOn(component, 'listenPoints');
        spyOn(component, 'requestFirstQuestion');
        spyOn(component, 'listenForNavigateResults');
        spyOn(component, 'handleDisconnect');
        spyOn(socketService, 'send');

        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, undefined);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestRoomId);
        expect(component.listenNewQuestion).not.toHaveBeenCalled();
        expect(component.listenCountDown).not.toHaveBeenCalled();
        expect(component.listenShowAnswer).not.toHaveBeenCalled();
        expect(component.listenPoints).not.toHaveBeenCalled();
        expect(component.requestFirstQuestion).not.toHaveBeenCalled();
        expect(component.listenForNavigateResults).not.toHaveBeenCalled();
        expect(component.handleDisconnect).not.toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('ngOnInit should call the function if the room id is defined and GameMode = Player', () => {
        component.gameMode = GameMode.Player;
        spyOn(component, 'listenNewQuestion');
        spyOn(component, 'listenCountDown');
        spyOn(component, 'listenShowAnswer');
        spyOn(component, 'listenPoints');
        spyOn(component, 'requestFirstQuestion');
        spyOn(component, 'listenForNavigateResults');
        spyOn(component, 'handleDisconnect');
        spyOn(socketService, 'send');

        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, '1234');

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestRoomId);
        expect(component.listenNewQuestion).toHaveBeenCalled();
        expect(component.listenCountDown).toHaveBeenCalled();
        expect(component.listenShowAnswer).toHaveBeenCalled();
        expect(component.listenPoints).toHaveBeenCalled();
        expect(component.requestFirstQuestion).toHaveBeenCalled();
        expect(component.listenForNavigateResults).toHaveBeenCalled();
        expect(component.handleDisconnect).toHaveBeenCalled();
    });

    it('ngOnInit should call the function if the room id is defined and GameMode = Test', () => {
        component.gameMode = GameMode.Test;
        spyOn(component, 'testInit');
        spyOn(socketService, 'send');

        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, '1234');

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestRoomId);
        expect(component.testInit).toHaveBeenCalled();
    });

    it('testInit() should send an event and listen to EndGame', () => {
        spyOn(socketService, 'send');
        component.gameMode = GameMode.Test;

        component.testInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.EndGame);
        socketHelper.peerSideEmit(SocketClientEventsListen.EvaluatePlayer);
        socketHelper.peerSideEmit(SocketClientEventsListen.Evaluating);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.StartGame);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LockLobby, true);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.JoinRoom, component.gameMode);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.EvaluateNextPlayer, { points: { name: GameMode.Test, points: 100 }, isInTest: true });
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.EvaluateFirstPlayer);
        expect((component as any).lastQuestion).toBe(true);
    });

    it('ngOnDestroy should remove all the listener', () => {
        spyOn(socketHelper, 'removeAllListeners');

        component.ngOnDestroy();

        expect(socketHelper.removeAllListeners).toHaveBeenCalled();
    });

    it('requestFirstQuestion() should send an event FirstQuestion', () => {
        spyOn(socketService, 'send');

        component.requestFirstQuestion();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.FirstQuestion);
    });

    it('listenCountDown() should listen to an event Countdown and set the timer', () => {
        component.listenCountDown();
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, 4);

        expect(component.timer).toEqual(4);
    });

    it('listenPanicMode() should call audio.play', () => {
        component.listenPanicMode();
        const audioSpy = spyOn((component as any).audio, 'play');
        socketHelper.peerSideEmit(SocketClientEventsListen.PanicMode);

        expect(audioSpy).toHaveBeenCalled();
    });


    it('listenCountDown() should send to an event LeaveLobby and navigate to home on GameMode.Test and on the last question', () => {
        spyOn(socketService, 'send');

        component.listenCountDown();
        component.gameMode = GameMode.Test;
        (component as any).questionState = QuestionState.ShowAnswers;
        (component as any).lastQuestion = false;
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, 0);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NextQuestion);
    });

    it('listenCountDown() should send to an event NextQuestion on GameMode.Test and not on the last question', () => {
        spyOn(socketService, 'send');

        component.listenCountDown();
        component.gameMode = GameMode.Test;
        (component as any).questionState = QuestionState.ShowAnswers;
        (component as any).lastQuestion = true;
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, 0);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('listenNewQuestion() should listen to an event NewQuestion and set the question QCM', () => {
        const question: Question = getFakeQuestion(QuestionType.QCM);
        (component as any).answers = question.choices;
        component.listenNewQuestion();
        socketHelper.peerSideEmit(SocketClientEventsListen.NewQuestion, question);

        expect(component.currentQuestion).toEqual(question);
        expect((component as any).questionState).toEqual(QuestionState.InQuestion);
        expect((component as any).answers).toEqual([]);
    });

    it('listenNewQuestion() should listen to an event NewQuestion and set the question QRL', () => {
        const question: Question = getFakeQuestion(QuestionType.QRL);
        (component as any).answers = 'test';
        component.listenNewQuestion();
        socketHelper.peerSideEmit(SocketClientEventsListen.NewQuestion, question);

        expect(component.currentQuestion).toEqual(question);
        expect((component as any).questionState).toEqual(QuestionState.InQuestion);
        expect((component as any).answers).toEqual('');
    });

    it('handleAnswer() should listen to an event NewQuestion and set the question', () => {
        const question: Question = getFakeQuestion(QuestionType.QCM);
        spyOn(component, 'submitAnswer');
        const time = new Date().getTime();

        component.handleAnswer({ answer: question.choices, timerExpired: false });

        expect(component.submitAnswer).toHaveBeenCalledWith(time);
        expect((component as any).answers).toEqual(question.choices);
    });

    it('handleAnswer() should listen to an event NewQuestion and set the question when timer expired', () => {
        const question: Question = getFakeQuestion(QuestionType.QCM);
        spyOn(component, 'submitAnswer');

        component.handleAnswer({ answer: question.choices, timerExpired: true });

        expect(component.submitAnswer).toHaveBeenCalledWith(Infinity);
        expect((component as any).answers).toEqual(question.choices);
    });

    it('submitAnswer() should submit the answer QCM with the time', () => {
        const question: Question = getFakeQuestion(QuestionType.QCM);
        (component as any).answers = question.choices;
        (component as any).questionState = QuestionState.InQuestion;
        spyOn(socketService, 'send');
        const time = new Date().getTime();
        component.submitAnswer(time);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.SubmitAnswerQcm, new AnswerSubmit(time, [0]));
        expect((component as any).answers).toEqual(question.choices);
        expect((component as any).questionState).toEqual(QuestionState.Submitted);
    });

    it('submitAnswer() should submit the answer QRL with the time', () => {
        component.currentQuestion = getFakeQuestion(QuestionType.QRL);
        (component as any).answers = 'test';
        (component as any).questionState = QuestionState.InQuestion;
        spyOn(socketService, 'send');
        const time = new Date().getTime();
        component.submitAnswer(time);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.SubmitAnswerQrl, new AnswerSubmit(time, 'test'));
        expect((component as any).answers).toEqual('test');
        expect((component as any).questionState).toEqual(QuestionState.Submitted);
    });

    it('listenShowAnswer() should listen to an event ShowAnswer, send an event point and set the correctChoices', () => {
        spyOn(socketService, 'send');
        component.listenShowAnswer();
        socketHelper.peerSideEmit(SocketClientEventsListen.ShowAnswer, [0]);

        expect(component.correctChoices).toEqual([0]);
        expect((component as any).questionState).toEqual(QuestionState.InQuestion);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.Points);
    });

    it('listenShowAnswer() should in mode test listen to an event ShowAnswer, send an event point, set the correctChoices and send a nextQuestion event', () => {
        component.gameMode = GameMode.Test;
        spyOn(socketService, 'send');
        component.listenShowAnswer();
        socketHelper.peerSideEmit(SocketClientEventsListen.ShowAnswer, [0]);

        expect(component.correctChoices).toEqual([0]);
        expect((component as any).questionState).toEqual(QuestionState.InQuestion);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.Points);
    });

    it('listenEvaluating() should listen to an event ShowAnswer, send an event point and set the correctChoices', () => {
        spyOn(socketService, 'send');
        component.listenEvaluating();
        socketHelper.peerSideEmit(SocketClientEventsListen.Evaluating);

        expect(component.questionState).toEqual(QuestionState.Evaluating);
    });

    it('listenPoints() should listen to an event ShowAnswer, send an event nextQuestion and set the totalPoints of the player', () => {
        component.gameMode = GameMode.Test;
        spyOn(socketService, 'send');
        component.listenPoints();
        socketHelper.peerSideEmit(SocketClientEventsListen.Points, new Points('Wake up', 42, true));

        expect(component.totalPoints).toEqual(42);
        expect(component.hasBonus).toEqual(true);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NextQuestionCountdown);
    });

    it('listenPoints() should listen to an event ShowAnswer, send an event nextQuestion and set the totalPoints of the player even without a hasBonus', () => {
        component.gameMode = GameMode.Test;
        spyOn(socketService, 'send');
        component.listenPoints();
        socketHelper.peerSideEmit(SocketClientEventsListen.Points, new Points('Wake up', 42));

        expect(component.totalPoints).toEqual(42);
        expect(component.hasBonus).toEqual(false);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NextQuestionCountdown);
    });

    it('listenForNavigateResults() should listen to an event NavigateToResults, and route to /results when it is call', () => {
        component.listenForNavigateResults();
        socketHelper.peerSideEmit(SocketClientEventsListen.NavigateToResults);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Results]);
    });

    it('handleDisconnected() should route the player in Player mode to /home and send an error if he did not abandon', () => {
        (component as any).abandon = false;
        component.gameMode = GameMode.Player;
        component.handleDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: ORGANIZER_LEFT_POPUP } });
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('handleDisconnected() should route the player in Player mode to /home if abandon is true', () => {
        (component as any).abandon = true;
        component.gameMode = GameMode.Player;
        component.handleDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(dialogMock.open).not.toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('handleDisconnected() should route the player in Test mode to /creation', () => {
        component.gameMode = GameMode.Test;
        component.handleDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('should set abandon to true and send NewDeselection and LeaveLobby events when abandonGame is call when it is a QCM', () => {
        const question = getFakeQuestion(QuestionType.QCM);
        questionComponent.getAnswer.and.returnValue(question.choices);
        const sendSpy = spyOn(socketService, 'send');

        component.abandonGame();

        expect((component as any).abandon).toBe(true);
        expect(sendSpy.calls.allArgs()).toEqual([[SocketServerEventsSend.NewDeselection, 1], [SocketServerEventsSend.LeaveLobby]]);
    });

    it('should set abandon to true and LeaveLobby events when abandonGame is call and modifyQuestion when it is a QRL', () => {
        const question = getFakeQuestion(QuestionType.QRL);
        component.currentQuestion = question;
        questionComponent.modifyingQuestion = true;
        const sendSpy = spyOn(socketService, 'send');

        component.abandonGame();

        expect((component as any).abandon).toBe(true);
        expect(sendSpy.calls.allArgs()).toEqual([[SocketServerEventsSend.ModifyQuestion, !questionComponent.modifyingQuestion], [SocketServerEventsSend.LeaveLobby]]);
    });
});

const getFakeQuestion = ((type: QuestionType) => {

    return {
        text: getRandomString(),
        points: 10,
        type: type,
        choices: [
            { text: 'choice1', isCorrect: true, selected: true },
            { text: 'choice2', isCorrect: false, selected: false },
        ],
    }
});

const BASE_36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);
