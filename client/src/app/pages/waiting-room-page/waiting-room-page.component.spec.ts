import { HttpClientModule } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Room } from '@app/common-client/interfaces/room';
import { HeaderComponent } from '@app/components/general/header/header.component';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { GameMessage } from '@common/client-message/game-pop-up';
import { GameState } from '@common/enum/socket-messages';
import { Subject, of } from 'rxjs';
import { WaitingRoomPageComponent } from './waiting-room-page.component';

describe('WaitingRoomPageComponent', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let mockRouter: Router;
    let mockMatDialog: MatDialog;
    let mockRoomManager: RoomManagerService;
    let debugElement: DebugElement;
    let gameControllerService: GameControllerService;
    let gameConnectionSocketSpy: jasmine.SpyObj<GameConnectionSocketService>;
    const gameSubject = new Subject<string>();
    beforeEach(async () => {
        gameConnectionSocketSpy = jasmine.createSpyObj(
            'GameConnectionSocketService',
            ['connect', 'disconnect', 'connectToGameStage', 'connectHostToGame', 'connectPlayersToGame'],
            { gameStageSubject$: gameSubject },
        );

        await TestBed.configureTestingModule({
            declarations: [WaitingRoomPageComponent, HeaderComponent],
            imports: [RouterTestingModule, HttpClientModule, MatDialogModule],
            providers: [
                MatDialog,
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: convertToParamMap({ id: 'testRoomId' }) },
                    },
                },
                { provide: GameConnectionSocketService, useValue: gameConnectionSocketSpy },
                {
                    provide: GameControllerService,
                    useValue: {
                        getGameInfo: () => of({ id: 'testRoomId' }),
                    },
                },
                PlayerConnectionSocketService,
                GameControllerService,
                {
                    provide: RoomManagerService,
                    useValue: jasmine.createSpyObj('RoomManager', ['leaveRoom']),
                },
            ],
        }).compileComponents();

        mockRouter = TestBed.inject(Router);
        mockMatDialog = TestBed.inject(MatDialog);
        mockRoomManager = TestBed.inject(RoomManagerService);
        gameControllerService = TestBed.inject(GameControllerService);
        gameConnectionSocketSpy = TestBed.inject(GameConnectionSocketService) as jasmine.SpyObj<GameConnectionSocketService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should return early if roomId is not provided', () => {
            spyOn(component, 'navigationHandler').and.stub();
            spyOn(component['route'].snapshot.paramMap, 'get').and.returnValue(null);
            spyOn(component['gameControllerService'], 'getGameInfo');
            component.ngOnInit();
            expect(component.navigationHandler).not.toHaveBeenCalled();
        });

        it('should call navigationHandler when roomId is available', () => {
            const room: Room = { id: 'testRoomId' } as Room;
            spyOn(component, 'navigationHandler').and.stub();
            spyOn(gameControllerService, 'getGameInfo').and.returnValue(of(room));
            component.ngOnInit();
            expect(component.navigationHandler).toHaveBeenCalledWith(room);
        });
    });

    describe('setCurrentRoom', () => {
        it('should set currentRoom and connect to game stage and players', () => {
            const room: Room = { id: 'testRoomId' } as Room;
            component.currentPlayer = new Player('testPlayer');
            const gameConnectionSocket = debugElement.injector.get(GameConnectionSocketService);
            const playerConnectionSocket = debugElement.injector.get(PlayerConnectionSocketService);

            spyOn(playerConnectionSocket, 'connectPlayerToRoom').and.stub();
            spyOn(playerConnectionSocket, 'connectPlayerToGame').and.stub();

            component.setCurrentRoom(room);

            expect(component.currentRoom).toEqual(room);
            expect(gameConnectionSocket.connectToGameStage).toHaveBeenCalledWith(room);
            expect(playerConnectionSocket.connectPlayerToRoom).toHaveBeenCalledWith(room);
            expect(playerConnectionSocket.connectPlayerToGame).toHaveBeenCalledWith(room, component.currentPlayer.name);
        });

        it('should set roundStarting to true if currentState is BEFORE_START', () => {
            const room: Room = { id: 'testRoomId', currentState: GameState.BEFORE_START } as Room;
            component.currentPlayer = new Player('testPlayer');
            const playerConnectionSocket = debugElement.injector.get(PlayerConnectionSocketService);

            spyOn(playerConnectionSocket, 'connectPlayerToRoom').and.stub();
            spyOn(playerConnectionSocket, 'connectPlayerToGame').and.stub();

            component.setCurrentRoom(room);

            expect(component.roundStarting).toBeTruthy();
        });

        it('should call checkState when a new state is emitted', () => {
            const mockState = GameState.BEFORE_START;
            const mockRoom = {} as Room;
            const mockPlayer = new Player('testingName');
            component.currentPlayer = mockPlayer;
            mockRoom.listPlayers = [mockPlayer];
            const checkStateSpy = spyOn(component, 'checkState').and.callThrough();

            component.setCurrentRoom(mockRoom);
            gameSubject.next(GameState.BEFORE_START);

            expect(checkStateSpy).toHaveBeenCalledWith(mockState);
            expect(component.roundStarting).toBeTruthy();
        });
    });

    describe('endRoom', () => {
        it('should call showDialog with GameMessage.ORG_LEFT and navigate to home', () => {
            spyOn(component, 'showDialog').and.stub();
            spyOn(mockRouter, 'navigate').and.stub();
            component.endRoom();
            expect(component.showDialog).toHaveBeenCalledWith(GameMessage.ORG_LEFT);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        });
    });

    describe('checkState', () => {
        it('should set roundStarting to true if state is GameState.BEFORE_START', () => {
            component.roundStarting = false;
            component.checkState(GameState.BEFORE_START);
            expect(component.roundStarting).toBeTrue();
        });

        it('should call endRoom if state is GameState.END_ROOM', () => {
            spyOn(component, 'endRoom').and.stub();
            component.checkState(GameState.END_ROOM);
            expect(component.endRoom).toHaveBeenCalled();
        });
    });

    describe('navigationHandler', () => {
        it('should navigate to home when room has no id', () => {
            const room: Room = { id: '' } as Room;
            spyOn(mockRouter, 'navigate').and.stub();
            component.navigationHandler(room);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('should navigate to room if room has id and player is not in room', () => {
            const room: Room = { id: 'testRoomId' } as Room;
            spyOn(mockRouter, 'navigate').and.stub();
            spyOn(component, 'setCurrentRoom').and.stub();
            spyOn(gameControllerService, 'findPlayerInRoom').and.returnValue(new Player('testPlayer'));
            component.navigationHandler(room);
            expect(gameControllerService.findPlayerInRoom).toHaveBeenCalledWith(room, component.currentPlayer);
            expect(component.setCurrentRoom).toHaveBeenCalledWith(room);
        });
    });

    describe('showDialog', () => {
        it('should open MatDialog with the correct message', () => {
            const message = 'Test Message';
            spyOn(mockMatDialog, 'open').and.stub();
            component.showDialog(message);
            expect(mockMatDialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
                data: { message },
            });
        });
    });

    describe('setCurrentPlayer', () => {
        it('should set current player in sessionStorage', () => {
            const player = JSON.stringify({ name: 'Test Player', score: 100 });
            sessionStorage.setItem('currentPlayer', player);
            spyOn(sessionStorage, 'getItem').and.returnValue(player);
            component['setCurrentPlayer']();
            expect(component.currentPlayer).toEqual(JSON.parse(player));
        });
    });

    describe('currentPlayerLeft', () => {
        it('should remove currentPlayer from sessionStorage and call roomManager.leaveRoom with correct arguments', () => {
            spyOn(sessionStorage, 'removeItem');
            component.currentPlayer = new Player('testPlayer');
            component.currentRoom = { id: 'testRoomId' } as Room;
            component.currentPlayerLeft();
            expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentPlayer');
            expect(mockRoomManager.leaveRoom).toHaveBeenCalledWith('testPlayer', 'testRoomId');
        });
    });
});
