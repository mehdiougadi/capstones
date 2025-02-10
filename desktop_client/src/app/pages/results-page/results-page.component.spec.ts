import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ORG_NAME, QuestionType, Routes, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { ChatBadgeComponent } from '@app/chat-badge/chat-badge.component';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ChatComponent } from '@app/components/chat/chat.component';
import { HistogramChoice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { Score } from '@app/interfaces/score';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';
import { ResultsPageComponent } from './results-page.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
    };

    const dialogMock = {
        open: jasmine.createSpy('open'),
    };

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            declarations: [ResultsPageComponent, ChatComponent, ChatBadgeComponent],
            imports: [RouterTestingModule, MatSidenavModule, BrowserAnimationsModule, MatIconModule],
            providers: [
                { provide: SocketClientService, useValue: socketService },
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: dialogMock },
            ],
        });

        fixture = TestBed.createComponent(ResultsPageComponent);
        component = fixture.componentInstance;
        socketService = TestBed.inject(SocketClientService);
    });

    afterEach(() => {
        dialogMock.open.calls.reset();
        mockRouter.navigate.calls.reset();
    });

    it('should disconnect and navigate to home', () => {
        spyOn(socketService, 'send');

        component.navigateToHome();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
    });

    it('should retrieve player list, scores and listen for disconnect on initialization when roomId is defined', () => {
        spyOn(component, 'retrievePlayerList');
        spyOn(component, 'retrieveLobbyScores');
        spyOn(component, 'listenDisconnect');
        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, '1234');

        expect(component.retrievePlayerList).toHaveBeenCalled();
        expect(component.retrieveLobbyScores).toHaveBeenCalled();
        expect(component.listenDisconnect).toHaveBeenCalled();
    });

    it('should retrieve choice history', () => {
        component.retrieveChoiceHistory();
        socketHelper.peerSideEmit(SocketClientEventsListen.ChoicesHistory, choicesHistory);

        expect(component.histogramChoices).toEqual(choicesHistory);
    });

    it('should retrieve questions', () => {
        component.retrieveQuestions();
        socketHelper.peerSideEmit(SocketClientEventsListen.Questions, fakeQuestions);

        expect(component.questions).toEqual(fakeQuestions);
    });

    it('should increment currentIndex when goToNextQuestion is called', () => {
        component.questions = fakeQuestions;
        component.currentIndex = 0;
        component.goToNextQuestion();
        expect(component.currentIndex).toBe(1);
    });

    it('should not increment currentIndex beyond questions.length - 1', () => {
        component.questions = fakeQuestions;
        component.currentIndex = 0;
        component.currentIndex = component.questions.length - 1;
        component.goToNextQuestion();
        expect(component.currentIndex).toBe(component.questions.length - 1);
    });

    it('should decrement currentIndex when goToPreviousQuestion is called', () => {
        component.questions = fakeQuestions;
        component.currentIndex = 0;
        component.currentIndex = 1;
        component.goToPreviousQuestion();
        expect(component.currentIndex).toBe(0);
    });

    it('should not decrement currentIndex below 0', () => {
        component.questions = fakeQuestions;
        component.currentIndex = 0;
        component.currentIndex = 0;
        component.goToPreviousQuestion();
        expect(component.currentIndex).toBe(0);
    });

    it('listenDisconnect() should disconnect and route to home', () => {
        component.ngOnInit();
        component.listenDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('retrievePlayerList() should listen NewPlayer and update playersName', () => {
        component.ngOnInit();
        component.retrievePlayerList();
        socketHelper.peerSideEmit(SocketClientEventsListen.NewPlayer, fakePlayers);

        expect(component.playersName).toEqual(fakePlayers);
    });

    it('retrieveLobbyScores() should listen LobbyScores and update playersName', () => {
        component.ngOnInit();
        component.retrieveLobbyScores();
        socketHelper.peerSideEmit(SocketClientEventsListen.LobbyScores, scores);

        expect(component.lobbyScores).toEqual(scores);
    });

    it('retrieveClientName() should update the value of ClientName', () => {
        component.ngOnInit();
        component.retrieveClientName();
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerName, fakeName);

        expect(component.clientName).toEqual(fakeName);
    });

    it('listenForDisconnect() should route to /creation if clientName === Organisateur', () => {
        component.ngOnInit();
        component.listenDisconnect();
        component.clientName = ORG_NAME;
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('should not retrieve player list, scores and listen for disconnect on initialization when roomId is undefined', () => {
        spyOn(component, 'retrievePlayerList');
        spyOn(component, 'retrieveLobbyScores');
        spyOn(component, 'listenDisconnect');
        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
        expect(component.retrievePlayerList).not.toHaveBeenCalled();
        expect(component.retrieveLobbyScores).not.toHaveBeenCalled();
        expect(component.listenDisconnect).not.toHaveBeenCalled();
    });

    const fakeName = 'Jean-bobin Billy-bob junior';

    const fakePlayers = ['Bob', 'Marcus', 'Jean-bobin Billy-bob junior'];

    const scores: Score[] = [
        { playerName: 'Jean-bobin Billy-bob junior', points: 12, bonusCount: 1 },
        { playerName: 'Bob', points: 30, bonusCount: 0 },
        { playerName: 'Marcus', points: 20, bonusCount: 0 },
    ];

    const choicesHistory: HistogramChoice[][] = [
        [
            { text: '100', isCorrect: true, selectedCount: 0 },
            { text: '50', isCorrect: false, selectedCount: 0 },
            { text: '0', isCorrect: false, selectedCount: 0 },
        ],
        [
            { text: '200', isCorrect: false, selectedCount: 0 },
            { text: '150', isCorrect: true, selectedCount: 0 },
            { text: '100', isCorrect: false, selectedCount: 0 },
        ],
        [
            { text: '300', isCorrect: false, selectedCount: 0 },
            { text: '550', isCorrect: false, selectedCount: 0 },
            { text: '150', isCorrect: true, selectedCount: 0 },
        ],
    ];

    const fakeQuestions: Question[] = [
        {
            text: 'What is the capital of France?',
            choices: [
                { text: 'Paris', isCorrect: true, selected: false },
                { text: 'Berlin', isCorrect: false, selected: false },
                { text: 'London', isCorrect: false, selected: false },
            ],
            points: 10,
            type: QuestionType.QCM,
        },
        {
            text: 'Who is known for the theory of relativity?',
            choices: [
                { text: 'Isaac Newton', isCorrect: false, selected: false },
                { text: 'Albert Einstein', isCorrect: true, selected: false },
                { text: 'Nikola Tesla', isCorrect: false, selected: false },
            ],
            points: 10,
            type: QuestionType.QCM,
        },
        {
            text: 'In which year did the first moon landing occur?',
            choices: [
                { text: '1959', isCorrect: false, selected: false },
                { text: '1969', isCorrect: true, selected: false },
                { text: '1979', isCorrect: false, selected: false },
            ],
            points: 10,
            type: QuestionType.QCM,
        },
    ];
});
