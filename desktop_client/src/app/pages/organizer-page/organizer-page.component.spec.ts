// Retrait du lint pour le any pour acceder aux attributs privées
/* eslint-disable @typescript-eslint/no-explicit-any */
// utilisation de constante pour tester les fonctions
/* eslint-disable @typescript-eslint/no-magic-numbers */
// Ignore le maximum de ligne dans un fichier de test
/* eslint-disable max-lines */
// besoin du stub pour tester le component
// eslint-disable-next-line max-classes-per-file
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import {
    DISCONNECTED_EMPTY_ROOM,
    MODIFY,
    NOT_MODIFY,
    PlayerState,
    QuestionState,
    QuestionType,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
    SortBy,
} from '@app/app.constants';
import { ChatBadgeComponent } from '@app/chat-badge/chat-badge.component';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { QrlFormComponent } from '@app/components/qrl-form/qrl-form.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Points } from '@app/interfaces/answer-points';
import { Choice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { PlayerSortingService } from '@app/services/player-sorting/player-sorting.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';
import { OrganizerPageComponent } from './organizer-page.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

@Component({
    selector: 'app-chat',
})
class ChatStubComponent {}

describe('OrganizerPageComponent', () => {
    let component: OrganizerPageComponent;
    let fixture: ComponentFixture<OrganizerPageComponent>;
    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
    };
    const dialogMock = {
        open: jasmine.createSpy('open'),
    };
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let playerSortService: PlayerSortingService;
    let timerComponent: jasmine.SpyObj<TimerComponent>;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        playerSortService = new PlayerSortingService();
        timerComponent = jasmine.createSpyObj('TimerComponent', ['resetPanicMode']);

        TestBed.configureTestingModule({
            declarations: [OrganizerPageComponent, HistogramComponent, ChatStubComponent, QrlFormComponent, ChatBadgeComponent, TimerComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: SocketClientService, useValue: socketService },
                { provide: MatDialog, useValue: dialogMock },
                { provide: PlayerSortingService, useValue: playerSortService },
            ],
            imports: [
                MatDividerModule,
                MatIconModule,
                MatFormFieldModule,
                MatSelectModule,
                BrowserAnimationsModule,
                MatSlideToggleModule,
                MatSidenavModule,
            ],
        });
        fixture = TestBed.createComponent(OrganizerPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        (component as any).timerComponent = timerComponent;
    });

    afterEach(() => {
        dialogMock.open.calls.reset();
        mockRouter.navigate.calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call the right function depending on navigationService return ', () => {
        spyOn(socketService, 'send');
        // retrait du lint pour le any pour acceder aux attributs privées
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn((component as any).navigationService, 'verifyPreviousRoute').and.returnValue(true);
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('ngOnInit should call the right function', () => {
        spyOn(component, 'listenQuestion');
        spyOn(component, 'listenCorrectChoices');
        spyOn(component, 'listenPlayers');
        spyOn(component, 'listenPlayerDisconnection');
        spyOn(component, 'listenCountdown');
        spyOn(component, 'listenAllSubmitted');
        spyOn(component, 'listenNewSelection');
        spyOn(component, 'listenNewDeselection');
        spyOn(component, 'listenEndGame');
        spyOn(component, 'listenNavigateToResults');
        spyOn(component, 'listenDisconnect');
        spyOn(component, 'listenPlayersPoints');
        spyOn(component, 'listenSubmitAnswer');

        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');

        expect(component.listenCountdown).toHaveBeenCalled();
        expect(component.listenCorrectChoices).toHaveBeenCalled();
        expect(component.listenDisconnect).toHaveBeenCalled();
        expect(component.listenPlayersPoints).toHaveBeenCalled();
        expect(component.listenQuestion).toHaveBeenCalled();
        expect(component.listenPlayerDisconnection).toHaveBeenCalled();
        expect(component.listenPlayers).toHaveBeenCalled();
        expect(component.listenAllSubmitted).toHaveBeenCalled();
        expect(component.listenNewSelection).toHaveBeenCalled();
        expect(component.listenNewDeselection).toHaveBeenCalled();
        expect(component.listenEndGame).toHaveBeenCalled();
        expect(component.listenNavigateToResults).toHaveBeenCalled();
        expect(component.listenSubmitAnswer).toHaveBeenCalled();
    });

    it('should navigate to /creation when an error occurs', () => {
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, '');

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('nextQuestion should send the correct event to the socket service', () => {
        spyOn(socketService, 'send');

        component.quitGame();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
    });

    it('should call quitGame when "quitter" button is clicked', () => {
        spyOn(component, 'quitGame');

        const button = fixture.debugElement.nativeElement.querySelector('.abandon-button');

        button.click();
        expect(component.quitGame).toHaveBeenCalled();
    });

    it('listenPlayersPoints should update "points" property for players when PlayersPoints event is received', () => {
        spyOn(socketService, 'send');
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');

        const testPointsData: Points[] = [
            { name: 'Player1', points: 10 },
            { name: 'Player2', points: 20 },
        ];
        component.players = [
            { name: 'Player1', points: 0, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Player3', points: 0, state: PlayerState.NoInteraction, canChat: true },
        ];
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayersPoints, testPointsData);
        const updatedPoints = component.players.find((player) => player.name === 'Player1')?.points;
        expect(updatedPoints).toEqual(10);
    });

    it('should call endGame when "présenter les résultats" button is clicked', () => {
        spyOn(socketService, 'send');
        component.endGame();
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NavigateToResults);
    });

    it('nextQuestion should send the correct event to the socket service', () => {
        spyOn(socketService, 'send');
        component.nextQuestion();

        expect(component['timerComponent'].resetPanicMode).toHaveBeenCalled();
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NextQuestionCountdown);
    });

    it('listenCorrectChoices should update "isCorrect" property in histogramChoices when CorrectChoices event is received', () => {
        const testCorrectChoices: number[] = [0, 2];

        component.histogramChoices = [
            { text: 'Choice 1', isCorrect: false, selected: false, selectedCount: 0 },
            { text: 'Choice 2', isCorrect: false, selected: false, selectedCount: 0 },
            { text: 'Choice 3', isCorrect: false, selected: false, selectedCount: 0 },
        ];

        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.CorrectChoices, testCorrectChoices);

        expect(component.histogramChoices[0].isCorrect).toBe(true);
        expect(component.histogramChoices[1].isCorrect).toBe(false);
        expect(component.histogramChoices[2].isCorrect).toBe(true);
    });

    it('endGame should send the correct event to the socket service and navigate to "/results"', () => {
        spyOn(socketService, 'send');

        component.endGame();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NavigateToResults);
    });

    it('listenQuestion should send FirstQuestion event to the socket service', () => {
        spyOn(socketService, 'send');

        component.listenQuestion();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.FirstQuestion);
    });

    it('listenQuestion should update currentQuestion and reset histogramChoices when a new question is received for QCM', () => {
        spyOn(component, 'sortList');
        const testQuestion: Question = {
            text: 'Test Question',
            choices: [{ text: 'Choice 1', isCorrect: true, selected: false }],
            points: 10,
            type: QuestionType.QCM,
        };
        component.players = [
            { name: 'testPlayer', points: 0, state: PlayerState.Abandoned, canChat: true },
            { name: 'Player3', points: 0, state: PlayerState.Confirmation, canChat: true },
        ];
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.NewQuestion, testQuestion);

        expect(component.currentQuestion).toEqual(testQuestion);

        expect(component.questionState).toEqual(QuestionState.InQuestion);

        expect(component.histogramChoices).toEqual(
            testQuestion.choices.map((choice: Choice) => ({
                ...choice,
                selectedCount: 0,
            })),
        );
        expect(component.players[1].state).toBe(PlayerState.NoInteraction);
        expect(component.players[0].state).toBe(PlayerState.Abandoned);
        expect(component.sortList).toHaveBeenCalled();
    });

    it('listenQuestion should update currentQuestion and reset histogramChoices when a new question is received for QRL', () => {
        component.players = [
            { name: 'testPlayer', points: 0, state: PlayerState.Abandoned, canChat: true },
            { name: 'Player3', points: 0, state: PlayerState.Confirmation, canChat: true },
        ];
        const testQuestion: Question = {
            text: 'Test Question',
            points: 10,
            choices: [],
            type: QuestionType.QRL,
        };
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.NewQuestion, testQuestion);

        expect(component.currentQuestion).toEqual(testQuestion);

        expect(component.questionState).toEqual(QuestionState.InQuestion);

        expect(component.histogramChoices).toEqual([
            {
                text: MODIFY,
                isCorrect: true,
                selectedCount: 0,
            },
            {
                text: NOT_MODIFY,
                isCorrect: false,
                selectedCount: 0,
            },
        ]);
    });

    it('should listen to modify question event from socket service with true', () => {
        component.histogramChoices = [
            { text: 'Modifier', isCorrect: true, selectedCount: 0 },
            { text: 'Non Modifier', isCorrect: true, selectedCount: 0 },
        ];

        component.listenModifyQuestion();
        socketHelper.peerSideEmit(SocketClientEventsListen.ModifyQuestion, true);

        expect(component.histogramChoices[0].selectedCount).toBe(1);
        expect(component.histogramChoices[1].selectedCount).toBe(0);
    });

    it('should listen to modify question event from socket service with false', () => {
        component.histogramChoices = [
            { text: 'Modifier', isCorrect: true, selectedCount: 1 },
            { text: 'Non Modifier', isCorrect: true, selectedCount: 0 },
        ];

        component.listenModifyQuestion();
        socketHelper.peerSideEmit(SocketClientEventsListen.ModifyQuestion, false);

        expect(component.histogramChoices[0].selectedCount).toBe(0);
        expect(component.histogramChoices[1].selectedCount).toBe(1);
    });

    it(' listenEvaluating should listen to Evaluating event from socket service and send EvaluateFirstPlayer', () => {
        spyOn(socketService, 'send');
        component.listenEvaluating();
        socketHelper.peerSideEmit(SocketClientEventsListen.Evaluating);

        expect(component.questionState).toEqual(QuestionState.Evaluating);
        expect(component.time).toEqual(0);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.EvaluateFirstPlayer);
    });

    it('listenPlayers should send RequestCurrentPlayers event to the socket service', () => {
        spyOn(socketService, 'send');

        component.listenPlayers();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestCurrentPlayers);
    });

    it('listenPlayers should update players when a new player is received', () => {
        spyOn(component, 'sortList');
        const testPlayers = ['Player 1', 'Player 2', 'Player 3'];
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.NewPlayer, testPlayers);

        expect(component.players).toEqual(
            testPlayers.map((player: string) => ({ name: player, points: 0, state: PlayerState.NoInteraction, canChat: true })),
        );
        expect(component.sortList).toHaveBeenCalled();
    });

    it('listenPlayerDisconnection should update abandoned property of players when a player is disconnected', () => {
        component.players = [{ name: 'TestPlayer', points: 0, state: PlayerState.NoInteraction, canChat: true }];
        let testPlayerName = 'TestPlayer';
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');

        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerDisconnected, testPlayerName);

        let updatedPlayer = component.players.find((player) => player.name === testPlayerName);

        expect(updatedPlayer).toBeDefined();
        expect(updatedPlayer?.state).toBe(PlayerState.Abandoned);
        testPlayerName = 'TestPlayer2';
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerDisconnected, testPlayerName);
        updatedPlayer = component.players.find((player) => player.name === testPlayerName);
        expect(updatedPlayer).toBeUndefined();
    });

    it('listenCountdown should update the "time" property when Countdown event is received', () => {
        let testCountdown = 10;
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, testCountdown);
        component.questionState = QuestionState.StartingNextQuestion;

        expect(component.time).toEqual(testCountdown);
        testCountdown = 0;
        spyOn(socketService, 'send');
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, testCountdown);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NextQuestion);
    });

    it('listenAllSubmitted should set "allSubmitted" to true when AllSubmitted event is received', () => {
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.ShowAnswer);

        expect(component.questionState).toEqual(QuestionState.Submitted);
    });

    it('listenNewDeselection should update selectedCount in histogramChoices when NewDeselection event is received', () => {
        const playerDeselection = { playerName: 'testPlayer', deselection: 1 };

        component.histogramChoices = [{ text: 'Choice 1', isCorrect: true, selected: false, selectedCount: 1 }];
        component.players = [
            { name: 'testPlayer', points: 0, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Player3', points: 0, state: PlayerState.NoInteraction, canChat: true },
        ];
        const initialSelectedCount = component.histogramChoices[playerDeselection.deselection - 1].selectedCount;
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');

        socketHelper.peerSideEmit(SocketClientEventsListen.NewDeselection, playerDeselection);

        expect(component.histogramChoices[playerDeselection.deselection - 1].selectedCount).toEqual(initialSelectedCount - 1);
        expect(component.players[0].state).toBe(PlayerState.NoInteraction);
    });

    it('listenNewSelection should update selectedCount in histogramChoices when NewSelection event is received', () => {
        const playerSelection = { playerName: 'testPlayer', selection: 1 };
        component.histogramChoices = [{ text: 'Choice 1', isCorrect: true, selected: false, selectedCount: 1 }];
        component.players = [
            { name: 'testPlayer', points: 0, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Player3', points: 0, state: PlayerState.NoInteraction, canChat: true },
        ];
        const initialSelectedCount = component.histogramChoices[playerSelection.selection - 1].selectedCount;
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.NewSelection, playerSelection);
        expect(component.histogramChoices[playerSelection.selection - 1].selectedCount).toEqual(initialSelectedCount + 1);
        expect(component.players[0].state).toBe(PlayerState.NoInteraction);
    });

    it('listenEndGame should update "jeuFini" to true when EndGame event is received', () => {
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.EndGame);
        expect(component.isLastQuestion).toBe(true);
    });

    it('listenNavigateToResults should navigate to "/results" when NavigateToResults event is received', () => {
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.NavigateToResults);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Results]);
    });

    it('listenDisconnect should open error popup and navigate to /creation when Disconnected event is received', () => {
        component.listenDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, {
            data: { title: 'Erreur', message: DISCONNECTED_EMPTY_ROOM },
        });
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('listenSubmitAnswer should send SubmitAnswer event to the socket service', () => {
        spyOn(component, 'sortList');
        const playerName = 'testPlayer';
        component.time = 10;
        component.players = [
            { name: 'testPlayer', points: 0, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Player3', points: 0, state: PlayerState.NoInteraction, canChat: true },
        ];
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'testRoomId');
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerSubmit, playerName);
        expect(component.players[0].state).toBe(PlayerState.Confirmation);
        expect(component.sortList).toHaveBeenCalled();
    });

    it('sortList should call sortPlayersByName when orderBy is SortBy.Name', () => {
        spyOn(playerSortService, 'sortPlayersByName');
        component.orderBy = SortBy.Name;
        component.orderAscending = true;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.sortList();

        expect(playerSortService.sortPlayersByName).toHaveBeenCalledWith(component.orderAscending, component.players);
    });

    it('sortList should call sortPlayersByPoints when orderBy is SortBy.Points', () => {
        spyOn(playerSortService, 'sortPlayersByPoints');
        component.orderBy = SortBy.Points;
        component.orderAscending = false;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.sortList();

        expect(playerSortService.sortPlayersByPoints).toHaveBeenCalledWith(component.orderAscending, component.players);
    });

    it(' sortList should call sortPlayersByState when orderBy is SortBy.State', () => {
        spyOn(playerSortService, 'sortPlayersByState');
        component.orderBy = SortBy.State;
        component.orderAscending = true;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.sortList();

        expect(playerSortService.sortPlayersByState).toHaveBeenCalledWith(component.orderAscending, component.players);
    });

    it('should flip the state of orderAscending when called', () => {
        component.orderAscending = false;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.toggleOrderSelection();

        expect(component.orderAscending).toBeTrue();
    });

    it('should call sortList after setting the order', () => {
        spyOn(component, 'sortList');
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.toggleOrderSelection();

        expect(component.sortList).toHaveBeenCalled();
    });

    it('should set orderBy to SortBy.Name when sortBy is SortBy.Name', () => {
        const sortBy = SortBy.Name;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.toggleSortSelection(sortBy);

        expect(component.orderBy).toEqual(SortBy.Name);
    });

    it('should set orderBy to SortBy.Points when sortBy is SortBy.Name', () => {
        const sortBy = SortBy.Points;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.toggleSortSelection(sortBy);

        expect(component.orderBy).toEqual(SortBy.Points);
    });

    it('should set orderBy to SortBy.State when sortBy is SortBy.Name', () => {
        const sortBy = SortBy.State;
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.toggleSortSelection(sortBy);

        expect(component.orderBy).toEqual(SortBy.State);
    });

    it('should call sortList after setting the orderBy', () => {
        spyOn(component, 'sortList');
        component.players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        component.toggleSortSelection(SortBy.Name);

        expect(component.sortList).toHaveBeenCalled();
    });

    it('should toggle chatPermission when toggleChatPermission is called', () => {
        spyOn(socketService, 'send');

        const player = { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true };

        component.toggleChatPermission(player);

        expect(player.canChat).toBe(false);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.ToggleChatPermission, player.name);
    });

    it('listenDisconnect should remove the player from the graph', () => {
        component.histogramChoices[0] = { text: 'test', isCorrect: true, selectedCount: 1 };
        component.histogramChoices[1] = { text: 'test', isCorrect: true, selectedCount: 1 };
        component.currentQuestion = {
            type: QuestionType.QRL,
            text: 'test',
            choices: [],
            points: 10,
        };
        component.players = [{ name: 'TestPlayer', points: 0, state: 'abandoned', canChat: true }];
        component.listenPlayerDisconnection();
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerDisconnected, 'test');
        expect(component.histogramChoices[1].selectedCount).toBe(0);
    });
});
