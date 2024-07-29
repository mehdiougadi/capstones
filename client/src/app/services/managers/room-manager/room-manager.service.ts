import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AddPlayerResponse } from '@app/common-client/interfaces/add-player';
import { Room } from '@app/common-client/interfaces/room';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { IdGeneratorService } from '@app/services/utils/id-generator/id-generator.service';
import { Player } from '@common/classes/player';
import { OrganizerMessage } from '@common/client-message/organizer-game-pop-up';
import { LOWER_BOUND } from '@common/constant/constants';
import { InteractiveList } from '@common/interfaces/interactive-list';
import { Quiz } from '@common/interfaces/quiz';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root',
})
export class RoomManagerService implements OnDestroy {
    private property: keyof InteractiveList = 'name';
    private sortDirection: string = 'asc';
    private readonly roomURL: string = environment.serverUrl + '/room';
    private subscription: Subscription;
    private colorOrder = ['red', 'yellow', 'green', 'black'];

    // eslint-disable-next-line max-params
    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly idGenerator: IdGeneratorService,
        private gameManager: GameManager,
        private dialog: MatDialog,
    ) {}

    createRoom(quiz: Quiz): void {
        const room = { id: this.idGenerator.generateId(), accessCode: this.idGenerator.generateAccessCode(), quiz };
        this.subscription = this.http.post<Room>(`${this.roomURL}`, { ...room }).subscribe({
            next: (response) => {
                if (response && response.id) {
                    this.router.navigate([`/organizer/${response.id}`]);
                }
            },
        });
    }

    joinRoom(username: string, accessCode: string): Observable<AddPlayerResponse> {
        const params = new HttpParams().set('username', username).set('accessCode', accessCode);
        return this.http.post<AddPlayerResponse>(`${this.roomURL}/addPlayer`, {}, { params });
    }

    leaveRoom(username: string, roomId: string): void {
        const params = new HttpParams().set('username', username).set('roomId', roomId);
        this.subscription = this.http.post<string>(`${this.roomURL}/removePlayer`, {}, { params }).subscribe({
            next: () => {
                this.router.navigate(['/home']);
            },
        });
    }

    changeLockRoom(room: Room): void {
        this.subscription = this.http.post(`${this.roomURL}/changeLock`, { room }).subscribe();
    }

    sendUpdatedListPlayers(roomId: string, listPlayers: Player[]): void {
        this.subscription = this.http.post(`${this.roomURL}/updateListPlayers`, { roomId, listPlayers }).subscribe();
    }

    async fetchRoomById(id: string): Promise<Room> {
        return new Promise<Room>((resolve) => {
            this.subscription = this.http.get<Room>(`${this.roomURL}/${id}`).subscribe({
                next: (room) => {
                    resolve(room);
                },
            });
        });
    }

    startGameForRoom(room: Room, modeType: boolean): void {
        if (!room.isLocked) {
            this.dialog.open(MessageDialogComponent, {
                data: { message: OrganizerMessage.UNLOCKED_ROOM },
            });
        } else if (room.listPlayers.length === 0 && !modeType) {
            this.dialog.open(MessageDialogComponent, {
                data: { message: OrganizerMessage.EMPTY_ROOM },
            });
        } else if (modeType) {
            this.subscription = this.http.post(`${this.roomURL}/startGame`, { room }).subscribe(() => {
                this.accessGame(room);
            });
        } else {
            this.subscription = this.http.post(`${this.roomURL}/startGame`, { room }).subscribe();
        }
    }

    advanceToNextRound(room: Room): void {
        room.currentQuestionIndex = ++room.currentQuestionIndex;
        this.subscription = this.http.post(`${this.roomURL}/nextRound`, { room }).subscribe();
    }

    banPlayerFromRoom(player: Player, room: Room): void {
        this.subscription = this.http.post(`${this.roomURL}/banPlayer`, { player, room }).subscribe();
    }

    sendUpdatedInteraction(roomId: string, player: Player): void {
        this.subscription = this.http.post(`${this.roomURL}/interaction`, { roomId, player }).subscribe();
    }

    sendQrlInteraction(roomId: string, player: Player): void {
        this.subscription = this.http.post(`${this.roomURL}/qrlInteraction`, { roomId, player }).subscribe();
    }

    sortCurrentPlayerList(room: Room): void {
        room.listPlayers = room.listPlayers.sort((a, b) => {
            let valueA;
            let valueB;
            if (this.property === 'interaction') {
                valueA = this.colorOrder.indexOf(a[this.property]);
                valueB = this.colorOrder.indexOf(b[this.property]);
            } else {
                valueA = a[this.property];
                valueB = b[this.property];
            }
            if (valueA < valueB) {
                return this.sortDirection === 'asc' ? LOWER_BOUND : 1;
            } else if (valueA > valueB) {
                return this.sortDirection === 'asc' ? 1 : LOWER_BOUND;
            }
            return a.name.localeCompare(b.name) * (this.sortDirection === 'asc' ? LOWER_BOUND : 1);
        });
    }

    setPropertyAndDirection(property: keyof InteractiveList, direction: string, room: Room): void {
        this.property = property;
        this.sortDirection = direction;
        this.sortCurrentPlayerList(room);
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private accessGame(room: Room): void {
        sessionStorage.setItem('currentPlayer', JSON.stringify(new Player('Organisateur')));
        this.gameManager.joinRoom('Organisateur', room.accessCode, true).subscribe({
            next: (res) => {
                this.router.navigate([`/room/${res.id}`]);
            },
        });
    }
}
