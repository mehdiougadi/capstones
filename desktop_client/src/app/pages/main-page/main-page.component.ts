import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
    BAD_ENTRY,
    ERROR_NO_TIME_ENTER_NAME,
    ERROR_ROOM_CODE_LENGTH,
    LOBBY_ID_LENGTH,
    POPUP_ERROR,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
} from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit, OnDestroy {
    isPopupLobbyIdOpen: boolean;
    isPopupNameOpen: boolean;
    lobbyCode: string;
    playerName: string;
    // les quatre paramètre sont nécessaire
    // eslint-disable-next-line max-params
    constructor(
        private readonly navigationService: NavigationService,
        private readonly dialog: MatDialog,
        private readonly socketClientService: SocketClientService,
        private router: Router,
    ) {
        this.isPopupLobbyIdOpen = false;
        this.isPopupNameOpen = false;
        this.lobbyCode = '';
        this.playerName = '';
    }

    ngOnInit() {
        this.listenToDisconnected();
        this.socketClientService.on(SocketClientEventsListen.RoomId, async (roomId: string) => {
            if (this.navigationService.verifyPreviousRoute(Routes.Home) && roomId) {
                this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
            }
        });
        this.socketClientService.send(SocketServerEventsSend.RequestRoomId);
        this.joinLobby();
        this.joinRoom();
    }

    ngOnDestroy() {
        this.socketClientService.socket.removeAllListeners();
    }

    listenToDisconnected() {
        this.socketClientService.on(SocketClientEventsListen.Disconnected, () => {
            if (this.isPopupNameOpen) {
                this.isPopupNameOpen = false;
                this.showErrorPopup(ERROR_NO_TIME_ENTER_NAME);
            }
        });
    }

    showErrorPopup(errorMessage: string): void {
        this.dialog.open(ErrorPopupComponent, {
            data: { title: POPUP_ERROR, message: errorMessage },
        });
    }

    changePopupLobbyIdState() {
        this.isPopupLobbyIdOpen = !this.isPopupLobbyIdOpen;
    }

    changePopupNameState() {
        if (this.isPopupNameOpen) {
            this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
        }
        this.isPopupNameOpen = !this.isPopupNameOpen;
    }

    joinRoom() {
        this.socketClientService.on(SocketClientEventsListen.RoomJoining, (data: { success: boolean; message: string }) => {
            if (this.lobbyCode.length === LOBBY_ID_LENGTH) {
                if (data.success) {
                    this.changePopupLobbyIdState();
                    this.changePopupNameState();
                } else {
                    this.showErrorPopup(data.message);
                }
            } else {
                this.showErrorPopup(ERROR_ROOM_CODE_LENGTH);
            }
        });
    }

    onKeyUp(event: KeyboardEvent) {
        if (this.isPopupLobbyIdOpen && event.key === 'Enter') {
            this.joinRoomButton();
        } else if (this.isPopupNameOpen && event.key === 'Enter') {
            this.joinLobbyButton();
        }
    }

    joinRoomButton() {
        this.socketClientService.send(SocketServerEventsSend.CheckRoom, this.lobbyCode);
    }

    joinLobbyButton() {
        this.socketClientService.send(SocketServerEventsSend.JoinRoom, this.playerName);
    }

    joinLobby() {
        this.socketClientService.on(SocketClientEventsListen.ChooseNameError, (answer: string) => {
            this.showErrorPopup(BAD_ENTRY + answer);
        });
        this.socketClientService.on(SocketClientEventsListen.ValidName, () => {
            this.router.navigate([Routes.Lobby, this.lobbyCode]);
        });
    }
}
