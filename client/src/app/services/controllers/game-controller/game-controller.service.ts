import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Room } from '@app/common-client/interfaces/room';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { Player } from '@common/classes/player';
import { GameMessage } from '@common/client-message/game-pop-up';
import { Answer } from '@common/interfaces/answer';
import { catchError, of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
@Injectable({
    providedIn: 'root',
})
export class GameControllerService {
    isInputFocused: boolean = false;
    private currentPlayer: Player;
    private isTesting: boolean;
    constructor(
        private gameManager: GameManager,
        private router: Router,
        private dialog: MatDialog,
    ) {}

    createSession(quizId: string, isTesting: boolean, randomMode: boolean): void {
        this.gameManager.createSession(quizId, isTesting, randomMode).subscribe({
            next: (roomId: string) => this.handleSessionSuccess(roomId, isTesting, randomMode),
            error: () => this.handleSessionError(),
        });
    }
    verificationAnswers(roomId: string, currentPlayer: string, answers: Answer[]): Observable<boolean> {
        return this.gameManager.verifAnswers(roomId, currentPlayer, answers).pipe(
            catchError(() => {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: GameMessage.CANT_VERIFY_ANSWER },
                });
                return of(false);
            }),
        );
    }

    setQrlAnswer(roomId: string, currentPlayer: string, qrlAnswer: string): Observable<boolean> {
        return this.gameManager.setQrlAnswer(roomId, currentPlayer, qrlAnswer).pipe(
            catchError(() => {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: GameMessage.CANT_VERIFY_ANSWER },
                });
                return of(false);
            }),
        );
    }

    findPlayerByName(playerList: Player[], playerName: string): Player {
        return playerList.find((player) => player.name === playerName) || new Player('null');
    }

    startNextRound(roomId: string): Observable<boolean> {
        return this.gameManager.nextRound(roomId).pipe(
            catchError(() => {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: GameMessage.CANT_VERIFY_ANSWER },
                });
                return of(false);
            }),
        );
    }
    deleteRoom(roomId: string): Observable<boolean> {
        return this.gameManager.deleteRoom(roomId);
    }

    getGameInfo(roomId: string): Observable<Room> {
        return this.gameManager.getGameInfo(roomId);
    }
    leaveRoom(username: string, roomId: string): Observable<boolean> {
        return this.gameManager.leaveRoom(username, roomId);
    }
    assignPlayer(room: Room, isTesting: boolean): Player {
        const storedPlayer = sessionStorage.getItem('currentPlayer');
        if (storedPlayer) {
            this.currentPlayer = JSON.parse(storedPlayer);
        }
        this.checkIfPlayerExist(room, isTesting);
        return this.currentPlayer;
    }
    checkIfGameExist(room: Room): boolean {
        if (this.isRoomEmpty(room)) {
            this.leavePage();
            return true;
        } else {
            this.handleNoneEmptyRoom(room);
            return false;
        }
    }
    saveIsTestingWithRoom(room: Room): void {
        if (room.isTesting) {
            this.saveIsTesting(true);
        } else {
            this.saveIsTesting(false);
        }
    }
    endRoom(): void {
        this.showDialog(GameMessage.ORG_LEFT);
        this.router.navigate(['/home']);
    }
    saveIsTesting(isTesting: boolean): void {
        sessionStorage.setItem('isTesting', JSON.stringify(isTesting));
    }
    findPlayerInRoom(room: Room, currentPlayer: Player): Player | undefined {
        return room.listPlayers.find((player) => player.name === currentPlayer.name);
    }
    leavePage(): void {
        this.setTesting();
        this.reRoute(this.isTesting);
    }

    private showDialog(message: string): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message },
        });
    }

    private joinRoomAsAdmin(roomId: string, accessCode: string, testingMode: boolean): void {
        if (testingMode) {
            this.gameManager.joinRoom('Admin', accessCode, false).subscribe({
                next: () => {
                    sessionStorage.setItem('currentPlayer', JSON.stringify(new Player('Admin')));
                    this.router.navigate([`/game/${roomId}`], { queryParams: { roomId, testing: true } });
                },
            });
        }
    }

    private handleSessionSuccess(roomId: string, isTesting: boolean, randomMode: boolean): void {
        if (isTesting) {
            this.handleTestingSession(roomId, isTesting);
        } else if (randomMode) {
            this.router.navigate([`/organizer/${roomId}`], {
                queryParams: { roomId, playerName: 'Admin-random', randomMode: randomMode.toString() },
            });
        } else {
            this.router.navigate([`/organizer/${roomId}`], { queryParams: { roomId, playerName: 'Admin', randomMode: randomMode.toString() } });
        }
    }

    private handleTestingSession(roomId: string, isTesting: boolean): void {
        this.gameManager.getGameInfo(roomId).subscribe({
            next: (room: Room) => this.joinRoomAsAdmin(roomId, room.accessCode, isTesting),
        });
    }

    private handleSessionError(): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message: GameMessage.CANT_GET_ROOM },
        });
    }
    private setTesting(): void {
        const isTesting = sessionStorage.getItem('isTesting');
        if (isTesting) {
            this.isTesting = Boolean(JSON.parse(isTesting));
        }
    }
    private checkIfPlayerExist(room: Room, isTesting: boolean): void {
        const thePlayer: Player | undefined = this.findPlayerInRoom(room, this.currentPlayer);
        if (this.currentPlayer && thePlayer) {
            this.updateCurrentPlayer(thePlayer);
        } else {
            this.handleNoneExistentPlayer(isTesting);
        }
    }
    private updateCurrentPlayer(player: Player): void {
        this.currentPlayer = player;
    }

    private handleNoneExistentPlayer(isTesting: boolean): void {
        this.reRoute(isTesting);
    }

    private reRoute(isTesting: boolean) {
        if (isTesting) {
            this.router.navigate(['/create-game']);
        } else {
            this.router.navigate(['/home']);
        }
    }

    private isRoomEmpty(room: Room): boolean {
        return room == null || Object.keys(room).length === 0;
    }

    private handleNoneEmptyRoom(room: Room): void {
        this.saveIsTestingWithRoom(room);
    }
}
