import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
    DISCONNECTED_EMPTY_ROOM,
    GameMode,
    LOCK_GAME_BEFORE_START,
    NO_PLAYER,
    ORGANIZER_LEFT_POPUP,
    ORG_NAME,
    POPUP_WARNING,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
    WARNING_KICKED_PLAYER,
} from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-lobby-page',
    templateUrl: './lobby-page.component.html',
    styleUrls: ['./lobby-page.component.scss'],
})
export class LobbyPageComponent implements OnInit, OnDestroy {
    playersName: string[];
    isLocked: boolean;
    clientName: string;
    countdownValue: number;
    gameId: string;
    roomId: string;
    gameStarted: boolean;
    hasLeft: boolean;

    // les quatre paramètre sont nécessaire
    // eslint-disable-next-line max-params
    constructor(
        private readonly navigationService: NavigationService,
        private readonly socketClientService: SocketClientService,
        private router: Router,
        private readonly dialog: MatDialog,
    ) {
        this.playersName = [];
        this.isLocked = false;
        this.gameStarted = false;
        this.hasLeft = false;
    }

    ngOnInit() {
        this.socketClientService.on(SocketClientEventsListen.RoomId, async (roomId: string) => {
            this.roomId = roomId;
            if (roomId) {
                if (this.navigationService.verifyPreviousRoute(Routes.Lobby)) {
                    this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
                    this.router.navigate([Routes.Home]);
                } else {
                    this.listenCountdown();
                    this.listenForDisconnect();
                    this.listenForDisconnectedPlayer();
                    this.listenForKick();
                    this.retrievePlayerList();
                    this.getPlayerStatus();
                    this.retrieveGameId();
                }
            } else {
                this.router.navigate([Routes.Home]);
            }
        });
        this.socketClientService.send(SocketServerEventsSend.RequestRoomId);
    }

    ngOnDestroy() {
        this.socketClientService.socket.removeAllListeners();
    }

    getPlayerStatus() {
        this.socketClientService.on(SocketClientEventsListen.PlayerName, (playerName: string) => {
            this.clientName = playerName;
        });
        this.socketClientService.send(SocketServerEventsSend.RequestName);
    }

    retrievePlayerList() {
        this.socketClientService.on(SocketClientEventsListen.NewPlayer, (players: string[]) => {
            this.playersName = players;
        });
        this.socketClientService.send(SocketServerEventsSend.RequestCurrentPlayers);
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
        this.socketClientService.send(SocketServerEventsSend.LockLobby, this.isLocked);
    }

    kickPlayer(playerName: string) {
        this.socketClientService.send(SocketServerEventsSend.KickPlayer, playerName);
    }

    listenForKick() {
        this.socketClientService.on(SocketClientEventsListen.PlayerKicked, () => {
            this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: WARNING_KICKED_PLAYER } });
            this.router.navigate([Routes.Home]);
        });
    }

    retrieveGameId() {
        this.socketClientService.on(SocketClientEventsListen.RetrieveGameId, (gameId: string) => {
            this.gameId = gameId;
        });
        this.socketClientService.send(SocketServerEventsSend.RetrieveGameId);
    }

    leaveLobby() {
        this.hasLeft = true;
        this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
    }

    listenCountdown() {
        this.socketClientService.on(SocketClientEventsListen.Countdown, (countdownValue: number) => {
            this.countdownValue = countdownValue;
            if (countdownValue === 0) {
                if (this.clientName === ORG_NAME) {
                    this.router.navigate([Routes.GameOrganizer, this.gameId]);
                } else {
                    this.router.navigate([Routes.Game, GameMode.Player, this.gameId]);
                }
            }
        });
    }

    listenForDisconnect() {
        this.socketClientService.on(SocketClientEventsListen.Disconnected, () => {
            if (this.clientName === ORG_NAME) {
                if (this.gameStarted) {
                    this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: DISCONNECTED_EMPTY_ROOM } });
                }
                this.router.navigate([Routes.Creation]);
            } else {
                if (!this.hasLeft) {
                    this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: ORGANIZER_LEFT_POPUP } });
                }
                this.router.navigate([Routes.Home]);
            }
        });
    }

    listenForDisconnectedPlayer() {
        this.socketClientService.on(SocketClientEventsListen.PlayerDisconnected, (disconnectedPlayer: string) => {
            this.playersName = this.playersName.filter((player) => player !== disconnectedPlayer);
        });
    }

    startGame() {
        if (!this.isLocked) {
            this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: LOCK_GAME_BEFORE_START } });
        } else if (this.playersName.length === 0) {
            this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: NO_PLAYER } });
        } else {
            this.gameStarted = true;
            this.socketClientService.on(SocketClientEventsListen.StartGame, () => {
                this.socketClientService.send(SocketServerEventsSend.StartGame);
            });
            this.socketClientService.send(SocketServerEventsSend.StartGameCountdown);
        }
    }
}
