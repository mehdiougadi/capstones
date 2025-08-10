import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StateHeader } from '@app/common-client/constant/state';
import { InputQuestion } from '@app/common-client/interfaces/input-question';
import { Room } from '@app/common-client/interfaces/room';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { GamePageControllerService } from '@app/services/controllers/game-page-controller/game-page-controller.service';
import { MouseControllerService } from '@app/services/controllers/mouse-controller/mouse-controller.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { Player } from '@common/classes/player';
import { OrganizerMessage } from '@common/client-message/organizer-game-pop-up';
import { GREEN, TIME_BETWEEN_ROUND } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Question } from '@common/interfaces/question';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    finishedLoading: boolean = false;

    roomId: string;
    pointsAvantQrl: number = 0;

    showPopup: boolean = false;
    popupMessage: string = '';

    gameFinished: boolean = false;
    header: StateHeader = StateHeader.GAME;

    inputQuestion: InputQuestion = {} as unknown as InputQuestion;
    private subscriptions: Subscriptions = {};
    // eslint-disable-next-line max-params
    constructor(
        private mouseControllerService: MouseControllerService,
        private router: Router,
        private route: ActivatedRoute,
        private readonly gameConnectionSocket: GameConnectionSocketService,
        private gamePageControllerService: GamePageControllerService,
        private roomManagerService: RoomManagerService,
    ) {
        this.gameConnectionSocket.connect();
    }
    mouseHitDetect(event: MouseEvent) {
        this.mouseControllerService.mouseHitDetect(event);
        this.inputQuestion.currentPlayer.interaction = GREEN;
        this.roomManagerService.sendUpdatedInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
    }
    ngOnInit(): void {
        this.inputQuestion.betweenRound = false;
        this.setCurrentPlayer();
        this.subscribeAllVariables();
        this.getParamsInit();
        this.gamePageControllerService.firstSetup(this.roomId);
    }

    ngOnDestroy(): void {
        this.subscriptions.roomSubscription?.unsubscribe();
        this.gameConnectionSocket?.disconnect();
        this.subscriptions.gameStageSubscription?.unsubscribe();
        this.gamePageControllerService.ngOnDestroy();
        this.subscriptions.timerSubscription?.unsubscribe();
        this.gamePageControllerService.leavePage();
    }

    private setCurrentPlayer() {
        const storedPlayer = sessionStorage.getItem('currentPlayer');
        if (storedPlayer) {
            this.inputQuestion.currentPlayer = JSON.parse(storedPlayer);
        }
    }

    private handleGameState(state: string): void {
        switch (state) {
            case GameState.NEXT_ROUND:
                this.inputQuestion.betweenRound = false;
                this.pointsAvantQrl = this.inputQuestion.currentPlayer.points;
                break;
            case GameState.END_GAME:
                this.finishGame();
                break;
            case GameState.BETWEEN_ROUNDS:
                this.inputQuestion.betweenRound = true;
                this.sendPointMessage();
                break;
            case GameState.PANIC_MODE:
                this.playSound();
                break;
            case GameState.QRL_EVALUATION:
                this.sendCorrectionMessage();
                break;
            case GameState.END_ROUND:
            case GameState.FINAL_END_ROUND:
                this.stopSound();
                break;
        }
    }

    private subscribeRoomState() {
        this.subscriptions.gameStageSubscription = this.gameConnectionSocket.gameStageSubject$.subscribe((state: string) => {
            this.handleGameState(state);
        });
    }
    private subscribeCurrentPlayer() {
        this.subscriptions.currentPlayerSubscription = this.gamePageControllerService.currentPlayerSubject$.subscribe((player: Player) => {
            this.inputQuestion.currentPlayer = player;
            this.handleFirstToAnswerBonus();
        });
    }
    private subscribeRoom() {
        this.subscriptions.roomSubscription = this.gamePageControllerService.roomSubject$.subscribe((room: Room) => {
            this.inputQuestion.room = room;
            this.finishedLoading = true;
        });
    }
    private subscribeCurrentQuestion() {
        this.subscriptions.currentQuestionSubscription = this.gamePageControllerService.currentQuestionSubject$.subscribe((question: Question) => {
            this.inputQuestion.question = question;
        });
    }
    private subscribeAllVariables() {
        this.subscribeRoomState();
        this.subscribeRoom();
        this.subscribeCurrentPlayer();
        this.subscribeCurrentQuestion();
    }

    private getParamsInit() {
        this.route.queryParams.subscribe((params) => {
            this.roomId = params['roomId'];
        });
    }

    private handleFirstToAnswerBonus() {
        if (this.inputQuestion.currentPlayer?.firstToAnswer) {
            this.showPopupMessage('Bonus de 20%, premier à répondre');
        }
    }

    private finishGame() {
        if (this.inputQuestion.room.isTesting) {
            this.router.navigate(['/create-game']);
        } else {
            this.gameFinished = true;
        }
    }

    private showPopupMessage(message: string) {
        this.popupMessage = message;
        this.showPopup = true;

        setTimeout(() => {
            this.hidePopup();
        }, TIME_BETWEEN_ROUND);
    }

    private hidePopup() {
        this.showPopup = false;
        this.popupMessage = '';
    }

    private sendCorrectionMessage() {
        if (!this.inputQuestion.room.isTesting) {
            this.showPopupMessage(OrganizerMessage.QRL_EVALUATION);
        }
    }

    private sendPointMessage() {
        if (this.inputQuestion.question.type === QuestionType.QRL && !this.inputQuestion.room.isTesting) {
            this.showPopupMessage('Vous avez obtenu ' + (this.inputQuestion.currentPlayer.points - this.pointsAvantQrl) + ' points !');
        }
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
