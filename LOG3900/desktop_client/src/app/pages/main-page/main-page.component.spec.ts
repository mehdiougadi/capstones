// besoin du stub pour tester le component
// eslint-disable-next-line max-classes-per-file
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ERROR_NO_TIME_ENTER_NAME, ERROR_ROOM_CODE_LENGTH, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';

@Component({
    selector: 'app-logo',
})
class LogoStubComponent {}
class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
        events: jasmine.createSpyObj('Observable', ['subscribe']),
    };

    const dialogMock = {
        open: jasmine.createSpy('open'),
    };

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [MainPageComponent, LogoStubComponent],
            providers: [
                { provide: SocketClientService, useValue: socketService },
                { provide: MatDialog, useValue: dialogMock },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
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
    });
    it('should ngOnInit() the component correctly', () => {
        spyOn(component, 'joinRoom');
        spyOn(component, 'joinLobby');
        spyOn(component, 'listenToDisconnected');
        component.ngOnInit();
        expect(component.joinRoom).toHaveBeenCalled();
        expect(component.joinLobby).toHaveBeenCalled();
        expect(component.listenToDisconnected).toHaveBeenCalled();
    });

    it('should listenToDisconnected() and show a pop up error if name display is open', () => {
        component.isPopupNameOpen = true;
        spyOn(socketService, 'send');
        spyOn(component, 'showErrorPopup');
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);
        component.listenToDisconnected();
        expect(component.isPopupNameOpen).toBe(false);
        expect(component.showErrorPopup).toHaveBeenCalledWith(ERROR_NO_TIME_ENTER_NAME);
    });

    it('should listenToDisconnected() and show nothing if name display is not open', () => {
        component.isPopupNameOpen = false;
        spyOn(socketService, 'send');
        spyOn(component, 'showErrorPopup');
        socketHelper.peerSideEmit(SocketClientEventsListen.Disconnected);
        component.listenToDisconnected();
        expect(component.isPopupNameOpen).toBe(false);
        expect(component.showErrorPopup).not.toHaveBeenCalledWith(ERROR_NO_TIME_ENTER_NAME);
    });

    it('showErrorPopup() should show an error with the message', () => {
        component.showErrorPopup(ERROR_NO_TIME_ENTER_NAME);

        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: 'Erreur', message: ERROR_NO_TIME_ENTER_NAME } });
    });

    it('changePopupLobbyIdState() should change the state of isPopupLobbyIdOpen ', () => {
        component.isPopupLobbyIdOpen = true;
        component.changePopupLobbyIdState();
        expect(component.isPopupLobbyIdOpen).toBe(false);
    });

    it('changePopupNameState() should change the state of isPopupNameOpen ', () => {
        component.isPopupNameOpen = true;
        component.changePopupNameState();
        expect(component.isPopupNameOpen).toBe(false);
    });

    it('joinRoom() should change the state of isPopupNameOpen and isPopupLobbyIdOpen', () => {
        spyOn(component, 'changePopupLobbyIdState');
        component.lobbyCode = 'ABCD';
        spyOn(component, 'changePopupNameState');

        component.joinRoom();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomJoining, { success: true, message: 'WAKE UP' });

        expect(component.changePopupLobbyIdState).toHaveBeenCalled();
        expect(component.changePopupNameState).toHaveBeenCalled();
    });

    it('joinRoom() should not change the state and send an error if the lobby input has not 4 characters', () => {
        spyOn(component, 'changePopupNameState');
        spyOn(component, 'changePopupLobbyIdState');
        component.lobbyCode = 'ABC';
        spyOn(component, 'showErrorPopup');

        component.joinRoom();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomJoining, { success: true, message: 'WAKE UP' });

        expect(component.changePopupLobbyIdState).not.toHaveBeenCalled();
        expect(component.changePopupNameState).not.toHaveBeenCalled();
        expect(component.showErrorPopup).toHaveBeenCalledWith(ERROR_ROOM_CODE_LENGTH);
    });

    it('joinRoom() should not change the state and send an error if the roomJoining return a success false', () => {
        spyOn(component, 'changePopupNameState');
        spyOn(component, 'changePopupLobbyIdState');
        component.lobbyCode = 'ABCD';
        spyOn(component, 'showErrorPopup');

        component.joinRoom();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomJoining, { success: false, message: 'WAKE UP' });

        expect(component.changePopupLobbyIdState).not.toHaveBeenCalled();
        expect(component.changePopupNameState).not.toHaveBeenCalled();
        expect(component.showErrorPopup).toHaveBeenCalledWith('WAKE UP');
    });

    it('onKeyUp() should call joinRoomButton() if the isPopupLobbyIdOpen = true', () => {
        spyOn(component, 'joinRoomButton');
        component.isPopupLobbyIdOpen = true;

        component.onKeyUp({ key: 'Enter' } as KeyboardEvent);

        expect(component.joinRoomButton).toHaveBeenCalledWith();
    });

    it('onKeyUp() should call joinLobbyButton() if the isPopupNameOpen = true', () => {
        spyOn(component, 'joinLobbyButton');
        component.isPopupNameOpen = true;

        component.onKeyUp({ key: 'Enter' } as KeyboardEvent);

        expect(component.joinLobbyButton).toHaveBeenCalledWith();
    });

    it('joinRoomButton() should send a checkRoom to the server', () => {
        spyOn(socketService, 'send');
        component.lobbyCode = 'ABCD';

        component.joinRoomButton();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.CheckRoom, component.lobbyCode);
    });

    it('joinLobbyButton() should send a joinRoom to the server', () => {
        spyOn(socketService, 'send');
        component.playerName = 'ABCD';

        component.joinLobbyButton();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.JoinRoom, component.playerName);
    });

    it('joinLobby() should listen to ChooseNameError', () => {
        spyOn(component, 'showErrorPopup');
        component.joinLobby();
        socketHelper.peerSideEmit(SocketClientEventsListen.ChooseNameError, 'WAKE UP');

        expect(component.showErrorPopup).toHaveBeenCalledWith('Entrée non valide: WAKE UP');
    });

    it('joinLobby() should listen to ValidName', () => {
        component.lobbyCode = 'ABCD';

        component.joinLobby();
        socketHelper.peerSideEmit(SocketClientEventsListen.ValidName);

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/lobby', component.lobbyCode]);
    });

    it('ngOnDestroy() should remove all listener', () => {
        spyOn(socketService.socket, 'removeAllListeners');
        component.ngOnDestroy();
        expect(socketService.socket.removeAllListeners).toHaveBeenCalled();
    });
});
