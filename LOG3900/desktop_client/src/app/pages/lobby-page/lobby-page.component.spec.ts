import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import {
    GameMode,
    LOCK_GAME_BEFORE_START,
    NO_PLAYER,
    ORG_NAME,
    POPUP_WARNING,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
    WARNING_KICKED_PLAYER,
} from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { LogoComponent } from '@app/components/logo/logo.component';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { LobbyPageComponent } from './lobby-page.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('LobbyPageComponent', () => {
    let component: LobbyPageComponent;
    let fixture: ComponentFixture<LobbyPageComponent>;
    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
        events: jasmine.createSpyObj('Observable', ['subscribe']),
    };
    const dialogMock = {
        open: jasmine.createSpy('open'),
    };

    mockRouter.events.subscribe.and.returnValue(of(new NavigationEnd(1, 'url1', 'url2')));
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            declarations: [LobbyPageComponent, LogoComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: SocketClientService, useValue: socketService },
                { provide: MatDialog, useValue: dialogMock },
            ],
        });
        fixture = TestBed.createComponent(LobbyPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
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
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, '1234');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('ngOnInit should call the right function', () => {
        spyOn(component, 'listenCountdown');
        spyOn(component, 'listenForDisconnect');
        spyOn(component, 'listenForDisconnectedPlayer');
        spyOn(component, 'listenForKick');
        spyOn(component, 'retrievePlayerList');
        spyOn(component, 'getPlayerStatus');
        spyOn(component, 'retrieveGameId');
        spyOn(socketService, 'send');

        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, 'ABCD');

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestRoomId);
        expect(component.listenCountdown).toHaveBeenCalled();
        expect(component.listenForDisconnect).toHaveBeenCalled();
        expect(component.listenForDisconnectedPlayer).toHaveBeenCalled();
        expect(component.listenForKick).toHaveBeenCalled();
        expect(component.retrievePlayerList).toHaveBeenCalled();
        expect(component.getPlayerStatus).toHaveBeenCalled();
        expect(component.retrieveGameId).toHaveBeenCalled();
    });

    it('ngOnInit should not call the function if the room id is undefined', () => {
        spyOn(component, 'listenCountdown');
        spyOn(component, 'listenForDisconnect');
        spyOn(component, 'listenForDisconnectedPlayer');
        spyOn(component, 'listenForKick');
        spyOn(component, 'retrievePlayerList');
        spyOn(component, 'getPlayerStatus');
        spyOn(component, 'retrieveGameId');
        spyOn(socketService, 'send');

        component.ngOnInit();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomId, undefined);

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestRoomId);
        expect(component.listenCountdown).not.toHaveBeenCalled();
        expect(component.listenForDisconnect).not.toHaveBeenCalled();
        expect(component.listenForDisconnectedPlayer).not.toHaveBeenCalled();
        expect(component.listenForKick).not.toHaveBeenCalled();
        expect(component.retrievePlayerList).not.toHaveBeenCalled();
        expect(component.getPlayerStatus).not.toHaveBeenCalled();
        expect(component.retrieveGameId).not.toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('ngOnDestroy() should remove all listener', () => {
        spyOn(socketService.socket, 'removeAllListeners');
        component.ngOnDestroy();
        expect(socketService.socket.removeAllListeners).toHaveBeenCalled();
    });

    it('listenCountdown should update the timer if it receive a countdown event', () => {
        const countdownValue = 10;
        component.listenCountdown();
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, countdownValue);

        component.listenCountdown();

        expect(component.countdownValue).toBe(countdownValue);
    });

    it('listenCountdown should update the timer and redirect if it receive a countdown event and the timer = 0', () => {
        const countdownValue = 0;
        component.listenCountdown();
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, countdownValue);

        expect(component.countdownValue).toBe(countdownValue);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Game, GameMode.Player, component.gameId]);
    });

    it('listenCountdown should update the timer and redirect if it receive a countdown event and the timer = 0 with "Organisateur"', () => {
        component.clientName = 'Organisateur';
        const countdownValue = 0;
        component.listenCountdown();
        socketHelper.peerSideEmit(SocketClientEventsListen.Countdown, countdownValue);

        expect(component.countdownValue).toBe(countdownValue);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.GameOrganizer, component.gameId]);
    });

    it('listenForDisconnect should call disconnected if it receive an event to disconnect', () => {
        component.listenForDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('listenForDisconnectedPlayer should remove the player from the list of players if it receive an event to disconnect player', () => {
        component.playersName = ['bonjour'];
        component.listenForDisconnectedPlayer();
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerDisconnected, 'bonjour');

        expect(component.playersName).toEqual([]);
    });

    it('listenForDisconnectedPlayer should send a warning pop-up if organizer left', () => {
        component.gameStarted = true;
        component.clientName = ORG_NAME;
        component.listenForDisconnect();
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);

        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Creation]);
    });

    it('listenForKick should kick the player from the lobby', () => {
        component.listenForKick();
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerKicked);
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: WARNING_KICKED_PLAYER } });
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('retrievePlayerList should update the players in the component', () => {
        spyOn(socketService, 'send');
        component.retrievePlayerList();
        socketHelper.peerSideEmit(SocketClientEventsListen.NewPlayer, ['ABCD', 'ABCDEF']);
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestCurrentPlayers);
        expect(component.playersName).toEqual(['ABCD', 'ABCDEF']);
    });

    it('getPlayerStatus should get the name of the player', () => {
        spyOn(socketService, 'send');
        component.getPlayerStatus();
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerName, 'bonjour');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestName);
        expect(component.clientName).toEqual('bonjour');
    });

    it('retrieveGameId should get the id of the game', () => {
        spyOn(socketService, 'send');
        component.retrieveGameId();
        socketHelper.peerSideEmit(SocketClientEventsListen.RetrieveGameId, 'ABCD');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RetrieveGameId);
        expect(component.gameId).toEqual('ABCD');
    });

    it('toggleLock() should change the value of isLocked', () => {
        component.isLocked = false;
        spyOn(socketService, 'send');
        component.toggleLock();
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LockLobby, component.isLocked);
        expect(component.isLocked).toBe(true);
    });

    it('kickPlayer() should send to the server the player to kick', () => {
        spyOn(socketService, 'send');
        component.kickPlayer('bonjour');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.KickPlayer, 'bonjour');
    });

    it('leaveLobby() should send to the server the player that has leave', () => {
        spyOn(socketService, 'send');
        component.leaveLobby();
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
    });

    it('startGame() should throw an alert if the lobby is not lock', () => {
        component.isLocked = false;
        component.startGame();
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: LOCK_GAME_BEFORE_START } });
    });

    it('startGame() send a warning pop-up if playersName is empty', () => {
        component.isLocked = true;
        component.playersName = [];
        component.startGame();
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: NO_PLAYER } });
    });

    it('startGame() should start the game if the lobby is lock', () => {
        component.isLocked = true;
        component.playersName.push('Billy-bob');
        const sendSpy = spyOn(socketService, 'send');

        component.startGame();
        socketHelper.peerSideEmit(SocketClientEventsListen.StartGame);

        const sendArgs = sendSpy.calls.allArgs();
        expect(sendArgs).toContain([SocketServerEventsSend.StartGame]);
        expect(sendArgs).toContain([SocketServerEventsSend.StartGameCountdown]);
    });
});
