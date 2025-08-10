import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { Answer } from '@common/interfaces/answer';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameConnectionSocketService {
    socket: Socket;

    // Pour les eslint, On veut mettre les subject priver mais si on met les attributs
    // public avant, il ne savent pas c'est quoi l'attribut priver
    private gameStageSubject = new Subject<string>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    gameStageSubject$ = this.gameStageSubject.asObservable();
    private updatedStatsSubject = new Subject<QuestionStats[]>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    updatedStats$ = this.updatedStatsSubject.asObservable();
    private updatedPlayersSubject = new Subject<Player[]>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    playersUpdatedStats$ = this.updatedPlayersSubject.asObservable();
    constructor(private router: Router) {}

    connect() {
        const serverUrlWithoutApi = environment.serverUrl.replace('/api', '');
        this.socket = io(serverUrlWithoutApi);
    }
    connectPlayersToGame(room: Room) {
        if (room) {
            this.socket.on(`startGameWithId:${room.id}`, () => {
                this.router.navigate([`/game/${room.id}`], { queryParams: { roomId: room.id, testing: false } });
            });
        }
    }
    connectToGameStage(room: Room) {
        if (room) {
            this.socket.on(`sendRoomState:${room.id}`, (roomState: string) => {
                this.gameStageSubject.next(roomState);
            });
        }
    }

    connectToStatsUpdate(roomId: string) {
        if (roomId) {
            this.socket.on(`sendUpdatedStats:${roomId}`, (updatedStats: QuestionStats[]) => {
                this.updatedStatsSubject.next(updatedStats);
            });
        }
    }

    sendStatsUpdate(roomId: string, answer: Answer, action: number) {
        if (roomId) {
            this.socket.emit('sendStatsUpdate', roomId, answer, action);
        }
    }

    sendStatsUpdateQRL(roomId: string, index: number) {
        if (roomId) {
            this.socket.emit('sendStatsUpdateQRL', roomId, index);
        }
    }

    connectToPlayersUpdate(roomId: string) {
        if (roomId) {
            this.socket.on(`sendPlayersUpdate:${roomId}`, (playersUpdatedStats: Player[]) => {
                this.updatedPlayersSubject.next(playersUpdatedStats);
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
