import { Injectable, OnDestroy } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { GameState } from '@common/enum/socket-messages';
import { Question } from '@common/interfaces/question';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GamePageControllerService implements OnDestroy {
    private subscriptions: Subscriptions = {};
    private room: Room;
    private currentPlayer: Player;

    // Pour les eslint, On veut mettre les subject priver mais si on met les attributs
    // public avant, il ne savent pas c'est quoi l'attribut priver
    private roomSubject = new Subject<Room>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    roomSubject$ = this.roomSubject.asObservable();
    private currentQuestionSubject = new Subject<Question>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    currentQuestionSubject$ = this.currentQuestionSubject.asObservable();
    private currentPlayerSubject = new Subject<Player>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    currentPlayerSubject$ = this.currentPlayerSubject.asObservable();

    // eslint-disable-next-line max-params
    constructor(
        protected gameControllerService: GameControllerService,
        private readonly gameConnectionSocket: GameConnectionSocketService,
        private playerConnectionSocketService: PlayerConnectionSocketService,
    ) {}
    firstSetup(roomId: string): void {
        this.subscriptions.gameStageSubscription = this.gameConnectionSocket.gameStageSubject$.subscribe((state: string) => {
            this.handleGameState(state);
        });
        this.subscribeToRoomChanges(roomId);
        this.playerConnectionSocketService.connect();
    }
    ngOnDestroy(): void {
        this.subscriptions.roomSubscription?.unsubscribe();
        this.subscriptions.gameStageSubscription?.unsubscribe();
        this.playerConnectionSocketService.disconnect();
    }
    leavePage(): void {
        this.gameControllerService.leavePage();
    }
    private handleGameState(state: string): void {
        switch (state) {
            case GameState.NEXT_ROUND:
            case GameState.BETWEEN_ROUNDS:
                this.updateRoomStateAfterRound(true);
                break;
            case GameState.END_ROUND:
            case GameState.FINAL_END_ROUND:
                this.updateRoomStateAfterRound(false);
                break;
            case GameState.END_ROOM:
                this.gameControllerService.endRoom();
                break;
        }
    }

    private subscribeToRoomChanges(roomId: string): void {
        this.subscriptions.roomSubscription = this.gameControllerService.getGameInfo(roomId).subscribe({
            next: this.handleRoomResponse.bind(this),
        });
    }

    private handleRoomResponse(response: Room): void {
        this.room = response;
        this.processRoomInformation();
    }
    private processRoomInformation(): void {
        if (!this.gameVerification()) {
            this.gameControllerService.saveIsTestingWithRoom(this.room);
            this.assignCurrentQuestion();
            this.gameConnectionSocket.connectToGameStage(this.room);
            const playerName: string = this.gameControllerService.assignPlayer(this.room, this.room.isTesting).name;
            this.playerConnectionSocketService.connectPlayerToGame(this.room, playerName);
        }
    }
    private gameVerification(): boolean {
        if (this.gameControllerService.checkIfGameExist(this.room)) {
            return true;
        }
        this.roomSubject.next(this.room);
        this.currentPlayer = this.gameControllerService.assignPlayer(this.room, this.room.isTesting);
        this.currentPlayerSubject.next(this.currentPlayer);
        return false;
    }

    private assignCurrentQuestion(): void {
        this.currentQuestionSubject.next(this.room.quiz.questions[this.room.currentQuestionIndex]);
    }
    private updateRoomStateAfterRound(isNextRound: boolean): void {
        this.subscriptions.roomSubscription = this.gameControllerService.getGameInfo(this.room.id).subscribe({
            next: (response: Room) => this.processRoomInfoResponse(response, isNextRound),
        });
    }

    private processRoomInfoResponse(response: Room, isNextRound: boolean): void {
        this.room = response;
        this.roomSubject.next(response);
        if (isNextRound) {
            this.currentQuestionSubject.next(this.room.quiz.questions[this.room.currentQuestionIndex]);
        } else {
            this.currentPlayer = this.gameControllerService.findPlayerByName(this.room.listPlayers, this.currentPlayer.name);
            this.currentPlayerSubject.next(this.currentPlayer);
        }
    }
}
