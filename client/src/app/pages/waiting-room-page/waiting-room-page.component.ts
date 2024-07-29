import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { StateHeader } from '@app/common-client/constant/state';
import { Room } from '@app/common-client/interfaces/room';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { GameMessage } from '@common/client-message/game-pop-up';
import { GameState } from '@common/enum/socket-messages';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room-page',
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnDestroy, OnInit {
    currentStateHeader: StateHeader = StateHeader.PlayerWait;
    currentRoom: Room;
    currentPlayer: Player;
    roundStarting: boolean = false;
    gameStageSubscription: Subscription;
    subscriptions: Subscriptions = {};
    // eslint-disable-next-line max-params
    constructor(
        private readonly roomManager: RoomManagerService,
        private readonly route: ActivatedRoute,
        private readonly playerConnectionSocket: PlayerConnectionSocketService,
        private readonly gameConnectionSocket: GameConnectionSocketService,
        private router: Router,
        private dialog: MatDialog,
        private gameControllerService: GameControllerService,
    ) {
        this.setCurrentPlayer();
        this.playerConnectionSocket.connect();
        this.gameConnectionSocket.connect();
    }

    ngOnInit(): void {
        const roomId = this.route.snapshot.paramMap.get('id');
        if (!roomId) return;
        this.subscriptions.roomSubscription?.unsubscribe();
        this.subscriptions.roomSubscription = this.gameControllerService.getGameInfo(roomId).subscribe({
            next: (room: Room) => {
                this.navigationHandler(room);
            },
        });
    }
    setCurrentRoom(room: Room) {
        this.currentRoom = room;
        if (room.currentState === GameState.BEFORE_START) {
            this.roundStarting = true;
        }
        this.gameConnectionSocket.connectToGameStage(room);
        this.playerConnectionSocket.connectPlayerToRoom(room);
        this.playerConnectionSocket.connectPlayerToGame(room, this.currentPlayer.name);
        this.playerConnectionSocket.banPlayerFromRoom(room);
        this.gameConnectionSocket.connectPlayersToGame(room);
        this.gameStageSubscription?.unsubscribe();
        this.gameStageSubscription = this.gameConnectionSocket.gameStageSubject$.subscribe((state: string) => {
            this.checkState(state);
        });
    }
    endRoom() {
        this.showDialog(GameMessage.ORG_LEFT);
        this.router.navigate(['/home']);
    }

    checkState(state: string) {
        if (state === GameState.BEFORE_START) {
            this.roundStarting = true;
        }
        if (state === GameState.END_ROOM) {
            this.endRoom();
        }
    }

    navigationHandler(room: Room) {
        if (!room.id || !this.gameControllerService.findPlayerInRoom(room, this.currentPlayer)) {
            this.router.navigate(['/home']);
        } else {
            this.setCurrentRoom(room);
        }
    }
    showDialog(message: string): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message },
        });
    }

    currentPlayerLeft() {
        sessionStorage.removeItem('currentPlayer');
        this.roomManager.leaveRoom(this.currentPlayer.name, this.currentRoom.id);
    }

    ngOnDestroy(): void {
        this.subscriptions.roomSubscription?.unsubscribe();
        this.gameStageSubscription?.unsubscribe();
        this.playerConnectionSocket.disconnect();
        this.gameConnectionSocket?.disconnect();
    }

    private setCurrentPlayer() {
        const storedPlayer = sessionStorage.getItem('currentPlayer');
        if (storedPlayer) {
            this.currentPlayer = JSON.parse(storedPlayer);
        }
    }
}
