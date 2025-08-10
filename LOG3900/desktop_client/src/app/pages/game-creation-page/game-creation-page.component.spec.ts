import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { GameMode, GameState, QuestionType, Routes, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Game } from '@app/interfaces/game';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GameService } from '@app/services/game/game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('GameCreationPageComponent', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
    };
    const mockGames: Game[] = [
        {
            id: '1',
            title: 'Game 1',
            duration: 5,
            description: 'Description 1',
            lastModification: new Date().toISOString(),
            questions: [
                {
                    text: 'Sample Question 1',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: QuestionType.QCM,
                },
                {
                    text: 'Sample Question 2',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: QuestionType.QCM,
                },
            ],
            isVisible: true,
        },
        {
            id: '2',
            title: 'Game 2',
            duration: 10,
            description: 'Description 2',
            lastModification: new Date().toISOString(),
            questions: [
                {
                    text: 'Sample Question 1',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: QuestionType.QCM,
                },
                {
                    text: 'Sample Question 2',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: QuestionType.QCM,
                },
            ],
            isVisible: true,
        },
    ];

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getAllGames']);
        TestBed.configureTestingModule({
            declarations: [GameCreationPageComponent],
            imports: [NoopAnimationsModule],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: Router, useValue: mockRouter },
                { provide: SocketClientService, useValue: socketService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;

        mockRouter.navigate.calls.reset();
        gameServiceSpy.getAllGames.and.returnValue(of(mockGames));

        fixture.detectChanges();
    });
    it('ngOnInit should call the right function depending on navigationService return ', () => {
        spyOn(socketService, 'send');
        // retrait du lint pour le any pour acceder aux attributs privées
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn((component as any).navigationService, 'verifyPreviousRoute').and.returnValue(true);
        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, '1234');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
    });

    it('should initialize games on ngOnInit', () => {
        gameServiceSpy.getAllGames.and.returnValue(of(mockGames));
        spyOn(component, 'listenForCreatedRoom');

        component.ngOnInit();

        expect(gameServiceSpy.getAllGames).toHaveBeenCalled();
        expect(component.listenForCreatedRoom).toHaveBeenCalled();
        expect(component.games[0]).toEqual(jasmine.objectContaining(mockGames[0]));
        expect(component.games[1]).toEqual(jasmine.objectContaining(mockGames[1]));

        expect(component.gameState['1']).toBe(GameState.Collapsed);
        expect(component.gameState['2']).toBe(GameState.Collapsed);

        expect(component.questionState['0-0']).toBe(GameState.Collapsed);
    });

    it('should collapse other games when one game expands', () => {
        component.gameState = {
            game1: GameState.Expanded,
            game2: GameState.Collapsed,
        };

        component.toggleGameState('game2');

        expect(component.gameState['game1']).toBe(GameState.Collapsed);
        expect(component.gameState['game2']).toBe(GameState.Expanded);
    });

    it('should render games and react to click', () => {
        gameServiceSpy.getAllGames.and.returnValue(of(mockGames));

        component.ngOnInit();
        fixture.detectChanges();

        const gameBoxElem = fixture.debugElement.nativeElement.querySelector('.game-box');
        expect(gameBoxElem).toBeTruthy();
        expect(gameBoxElem.textContent).toContain('Game 1');

        gameBoxElem.click();
        fixture.detectChanges();

        const expandedElem = fixture.debugElement.nativeElement.querySelector('.game-box.expanded');
        expect(expandedElem).toBeTruthy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle game state', () => {
        component.toggleGameState('1');
        expect(component.gameState['1']).toBe(GameState.Expanded);

        component.toggleGameState('1');
        expect(component.gameState['1']).toBe(GameState.Collapsed);
    });

    it('should toggle question state', () => {
        component.toggleQuestionState('0-0');
        expect(component.questionState['0-0']).toBe(GameState.Expanded);

        component.toggleQuestionState('0-0');
        expect(component.questionState['0-0']).toBe(GameState.Collapsed);
    });

    it('should render questions and choices', () => {
        component.games = mockGames;
        fixture.detectChanges();

        const gameBoxElem = fixture.debugElement.nativeElement.querySelector('.game-box');
        expect(gameBoxElem).toBeTruthy();
        gameBoxElem.click();
        fixture.detectChanges();

        const questionBoxElem = fixture.debugElement.nativeElement.querySelector('.question-box');
        expect(questionBoxElem).toBeTruthy();
        questionBoxElem.click();
        fixture.detectChanges();

        const choiceBoxElem = fixture.debugElement.nativeElement.querySelectorAll('.choice-box');
        expect(choiceBoxElem.length).toBe(2);
    });

    it('should close game box when close button is clicked', () => {
        component.toggleGameState('1');
        fixture.detectChanges();

        const closeBtnElem = fixture.debugElement.nativeElement.querySelector('.close-btn');
        closeBtnElem.click();
        fixture.detectChanges();

        expect(component.gameState['1']).toBe(GameState.Collapsed);
    });

    it('should navigate to game', () => {
        spyOn(socketService, 'send');
        component.createRoomAndNavigate('1');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.CreateRoom, '1');
    });

    it('should navigate to lobby if success = true and GameMode = Player', () => {
        component.mode = GameMode.Player;
        component.selectedGameId = '1';
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomCreation, { success: true, message: 'bonjour' });
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Lobby, '1']);
    });

    it('should navigate to test if success = true and GameMode = Test', () => {
        component.mode = GameMode.Test;
        component.selectedGameId = '1';
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomCreation, { success: true, message: 'bonjour' });
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Game, GameMode.Test, '1']);
    });

    it('should send an alert if success = false', () => {
        component.selectedGameId = '1';
        spyOn(window, 'alert');
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomCreation, { success: false, message: 'bonjour' });
        expect(window.alert).toHaveBeenCalledWith('bonjour');
    });

    it('should navigate to test game', () => {
        spyOn(socketService, 'send');
        component.navigateToTestGame('1');
        expect(component.selectedGameId).toEqual('1');
        expect(component.mode).toEqual(GameMode.Test);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.CreateRoom, '1');
    });
});
