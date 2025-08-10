import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StateHeader } from '@app/common-client/constant/state';
import { Room } from '@app/common-client/interfaces/room';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { TimerSocketService } from '@app/services/sockets/timer/timer-socket.service';
import { Player } from '@common/classes/player';
import { BLACK, RED } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';

@Component({
    selector: 'app-organizer-page',
    templateUrl: './organizer-page.component.html',
    styleUrls: ['./organizer-page.component.scss'],
})
export class OrganizerPageComponent implements OnDestroy, OnInit {
    isRandomMode: boolean = false;
    currentStateHeader: StateHeader = StateHeader.HostWait;
    host: Player = new Player('Organisateur');
    currentRoom: Room;
    roundStarting: boolean = false;
    gameStarted: boolean = false;
    gameFinished: boolean = false;
    timerRunning: boolean = true;
    isDisabled: boolean = true;
    isEvaluatingQrl: boolean = false;
    isResultsPage = false;
    indexQuestion: number = 0;
    currentQuestionIndex: number = 0;
    sub: Subscriptions = {};
    protected roundFinished: boolean;

    // eslint-disable-next-line max-params
    constructor(
        private readonly roomManager: RoomManagerService,
        private readonly route: ActivatedRoute,
        private readonly playerConnectionSocket: PlayerConnectionSocketService,
        private readonly gameConnectionSocket: GameConnectionSocketService,
        private gameManager: GameManager,
        private timer: TimerSocketService,
        private router: Router,
        private gameControllerService: GameControllerService,
    ) {
        this.disconnect();
        this.playerConnectionSocket.connect();
        this.gameConnectionSocket.connect();
        this.timer.connect();
    }

    ngOnInit(): void {
        const roomId = this.route.snapshot.paramMap.get('id');
        const randomMode = this.route.snapshot.queryParamMap.get('randomMode') === 'true';
        if (!roomId) return;

        this.sub.roomSubscription = this.gameControllerService.getGameInfo(roomId).subscribe({
            next: (room: Room) => {
                if (!room.id) {
                    this.router.navigate(['/home']);
                }
                this.setCurrentRoom(room, randomMode);
            },
        });
    }
    connectionSocketHandler(room: Room) {
        this.gameConnectionSocket.connectToGameStage(room);
        this.playerConnectionSocket.connectPlayerToRoom(room);
        this.playerConnectionSocket.setGameStarted(this.gameStarted);
        this.playerConnectionSocket.removePlayerFromRoom(room);
        this.playerConnectionSocket.connectHostToGame(room);
        this.gameConnectionSocket.connectToPlayersUpdate(room.id);
    }

    checkState(state: string, randomMode: boolean) {
        switch (state) {
            case GameState.BEFORE_START:
                this.handleBeforeStart();
                break;
            case GameState.END_ROUND:
                this.handleEndRound();
                break;
            case GameState.END_ROOM:
                this.handleEndRoom();
                break;
            case GameState.FINAL_END_ROUND:
                this.handleFinalEndRound();
                break;
            case GameState.NEXT_ROUND:
                this.handleNextRound();
                break;
            case GameState.BETWEEN_ROUNDS:
                this.handleBetweenRounds(randomMode);
                break;
            case GameState.END_GAME:
                this.handleEndGame();
                break;
            case GameState.PANIC_MODE:
                this.handlePanicMode();
                break;
            case GameState.QRL_EVALUATION:
                this.handleQrlEvaluation();
                break;
        }
    }

    handleBeforeStart() {
        this.roundStarting = true;
        this.gameStarted = true;
        this.playerConnectionSocket.setGameStarted(this.gameStarted);
    }

    handleEndRound() {
        this.stopSound();
        this.roundFinished = true;
        this.isDisabled = true;
    }

    handleEndRoom() {
        if (this.gameStarted) {
            this.ngOnDestroy();
        }
    }

    handleFinalEndRound() {
        this.stopSound();
        this.gameFinished = true;
    }

    handleNextRound() {
        this.roundStarting = false;
    }

    handleBetweenRounds(randomMode: boolean) {
        this.roundStarting = false;
        this.isEvaluatingQrl = false;
        if (randomMode) {
            this.currentRoom.currentQuestionIndex++;
        }
    }

    handleEndGame() {
        this.isResultsPage = true;
        this.gameFinished = true;
    }

    handlePanicMode() {
        this.playSound();
    }

    handleQrlEvaluation() {
        this.isEvaluatingQrl = true;
        this.isDisabled = false;
    }

    changeRoomState() {
        this.roomManager.changeLockRoom(this.currentRoom);
    }

    startGame() {
        this.roomManager.startGameForRoom(this.currentRoom, this.isRandomMode);
    }

    isLastQuestion(): boolean {
        return this.currentRoom.quiz.questions.length === this.currentRoom.currentQuestionIndex;
    }

    startNextRound() {
        this.roundFinished = false;
        this.indexQuestion++;
        this.roomManager.advanceToNextRound(this.currentRoom);
        this.resetColor();
    }

    showResults(): void {
        this.sub.gameSubscription = this.gameManager.endGame(this.currentRoom.id).subscribe({});
        this.isResultsPage = true;
    }

    ngOnDestroy(): void {
        this.disconnect();
        this.sub.gameStageSubscription?.unsubscribe();
        this.sub.updatedPlayersSubscription?.unsubscribe();
        if (!(this.isRandomMode && this.roundStarting)) {
            this.router.navigate(['/home']);
        }
    }

    disconnect(): void {
        this.gameConnectionSocket?.disconnect();
        this.playerConnectionSocket?.disconnect();
        this.timer?.disconnect();
    }

    stopTimer(): void {
        this.sub.timerSubscription = this.gameManager.stopTimer(this.currentRoom.id).subscribe({});
        this.timerRunning = false;
    }
    restartTimer(): void {
        this.sub.timerSubscription = this.gameManager.startTimer(this.currentRoom.id).subscribe({});
        this.timerRunning = true;
    }
    enablePanicMode(): void {
        this.sub.timerSubscription = this.gameManager.enablePanicMode(this.currentRoom.id).subscribe({});
    }

    private setCurrentRoom(room: Room, randomMode: boolean) {
        this.isRandomMode = randomMode;
        if (!room) return;
        this.currentRoom = room;
        this.currentRoom.currentQuestionIndex = 0;
        this.timer.handleTime(room);
        this.connectionSocketHandler(room);
        this.sub.updatedPlayersSubscription = this.gameConnectionSocket.playersUpdatedStats$.subscribe((players: Player[]) => {
            this.updateCurrentPlayerList(players);
        });
        this.sub.gameStageSubscription = this.gameConnectionSocket.gameStageSubject$.subscribe((state: string) => {
            this.checkState(state, randomMode);
        });
    }
    private updateCurrentPlayerList(players: Player[]): void {
        players.forEach((updatePlayer) => {
            const index = this.currentRoom.listPlayers.findIndex((player) => player.name === updatePlayer.name);
            if (index >= 0) {
                this.currentRoom.listPlayers[index] = updatePlayer;
            }
        });
        this.roomManager.sortCurrentPlayerList(this.currentRoom);
    }
    private resetColor(): void {
        this.currentRoom.listPlayers.forEach((player) => {
            if (player.interaction !== BLACK) {
                player.interaction = RED;
            }
        });
        this.roomManager.sortCurrentPlayerList(this.currentRoom);
    }
    private playSound() {
        const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
        audioPlayer?.play();
    }
    private stopSound(): void {
        const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
        audioPlayer?.pause();
        audioPlayer.currentTime = 0;
    }
}
