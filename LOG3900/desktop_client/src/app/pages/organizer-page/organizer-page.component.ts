import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import {
    ARROW_DOWN,
    ARROW_UP,
    DISCONNECTED_EMPTY_ROOM,
    MODIFY,
    MODIFYING,
    NOT_MODIFY,
    NOT_MODIFYING,
    POPUP_ERROR,
    PlayerState,
    QuestionState,
    QuestionType,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
    SortBy,
} from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Points } from '@app/interfaces/answer-points';
import { HistogramChoice } from '@app/interfaces/choice';
import { Player } from '@app/interfaces/player';
import { PlayerDeselection } from '@app/interfaces/player-deselection';
import { PlayerSelection } from '@app/interfaces/player-selection';
import { Question } from '@app/interfaces/question';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { PlayerSortingService } from '@app/services/player-sorting/player-sorting.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
@Component({
    selector: 'app-organizer-page',
    templateUrl: './organizer-page.component.html',
    styleUrls: ['./organizer-page.component.scss'],
})
export class OrganizerPageComponent implements OnInit, OnDestroy {
    @ViewChild('sidenav') sidenav: MatSidenav;
    @ViewChild(TimerComponent) private timerComponent: TimerComponent;
    currentQuestion: Question;
    histogramChoices: HistogramChoice[];
    time: number;
    players: Player[];
    isLastQuestion: boolean;
    orderBy: string;
    orderAscending: boolean;
    arrowClass: string;
    badgeCount: number;
    questionState: QuestionState;
    questionStateEnum: typeof QuestionState;
    abandonOrganisateur: boolean;

    // les  cinq paramètres sont nécessaire
    // eslint-disable-next-line max-params
    constructor(
        private readonly navigationService: NavigationService,
        readonly dialog: MatDialog,
        public router: Router,
        public socketService: SocketClientService,
        public playerSortingService: PlayerSortingService,
    ) {
        this.currentQuestion = {
            text: '',
            choices: [],
            points: 0,
            type: QuestionType.QCM,
        };
        this.histogramChoices = [];
        this.time = 0;
        this.isLastQuestion = false;
        this.orderBy = SortBy.Name;
        this.orderAscending = true;
        this.questionState = QuestionState.InQuestion;
        this.questionStateEnum = QuestionState;
        this.abandonOrganisateur = false;
        this.badgeCount = 0;
        this.arrowClass = ARROW_UP;
    }

    ngOnInit() {
        this.socketService.send(SocketServerEventsSend.RequestRoomId);
        this.socketService.on(SocketClientEventsListen.RoomId, async (roomId: string) => {
            if (roomId) {
                if (this.navigationService.verifyPreviousRoute(Routes.GameOrganizer)) {
                    this.socketService.send(SocketServerEventsSend.LeaveLobby);
                    this.router.navigate([Routes.Home]);
                } else {
                    this.listenPlayers();
                    this.listenQuestion();
                    this.listenCorrectChoices();
                    this.listenPlayerDisconnection();
                    this.listenCountdown();
                    this.listenAllSubmitted();
                    this.listenNewSelection();
                    this.listenNewDeselection();
                    this.listenEndGame();
                    this.listenNavigateToResults();
                    this.listenDisconnect();
                    this.listenPlayersPoints();
                    this.listenEvaluating();
                    this.listenModifyQuestion();
                    this.listenSubmitAnswer();
                }
            } else {
                this.router.navigate([Routes.Creation]);
            }
        });
    }

    ngOnDestroy(): void {
        this.socketService.socket.removeAllListeners();
    }

    nextQuestion() {
        this.socketService.send(SocketServerEventsSend.NextQuestionCountdown);
        this.questionState = QuestionState.StartingNextQuestion;
        this.timerComponent.resetPanicMode();
    }

    endGame() {
        this.socketService.send(SocketServerEventsSend.NavigateToResults);
    }

    listenPlayersPoints() {
        this.socketService.on(SocketClientEventsListen.PlayersPoints, (points: Points[]) => {
            this.players = this.players.map((player) => {
                const playerPoints = points.find((point) => point.name === player.name);
                if (playerPoints) {
                    return { ...player, points: playerPoints.points };
                }
                return player;
            });
            this.sortList();
        });
    }

    listenQuestion() {
        this.socketService.send(SocketServerEventsSend.FirstQuestion);
        this.socketService.on(SocketClientEventsListen.NewQuestion, (question: Question) => {
            this.questionState = QuestionState.InQuestion;
            this.currentQuestion = question;
            this.players = this.players.map((player) => {
                if (player.state !== PlayerState.Abandoned) {
                    return { ...player, state: PlayerState.NoInteraction };
                }
                return player;
            });
            this.sortList();
            if (this.currentQuestion.type === QuestionType.QCM) {
                this.histogramChoices = this.currentQuestion.choices.map((choice) => ({
                    ...choice,
                    selectedCount: 0,
                }));

                this.socketService.send(SocketServerEventsSend.CorrectChoices);
            }
            if (this.currentQuestion.type === QuestionType.QRL) {
                this.histogramChoices = [
                    { text: MODIFY, isCorrect: true, selectedCount: 0 },
                    { text: NOT_MODIFY, isCorrect: false, selectedCount: 0 },
                ];
            }
        });
    }

    listenSubmitAnswer() {
        this.socketService.on(SocketClientEventsListen.PlayerSubmit, (playerName: string) => {
            this.players = this.players.map((player) => {
                if (player.name === playerName && this.time > 0) {
                    return { ...player, state: PlayerState.Confirmation };
                }
                return player;
            });
            this.sortList();
        });
    }

    listenPlayers() {
        this.socketService.send(SocketServerEventsSend.RequestCurrentPlayers);
        this.socketService.on(SocketClientEventsListen.NewPlayer, (players: string[]) => {
            this.players = players.map((player: string) => ({ name: player, points: 0, state: PlayerState.NoInteraction, canChat: true }));
            this.sortList();
        });
    }

    listenPlayerDisconnection() {
        this.socketService.on(SocketClientEventsListen.PlayerDisconnected, (playerDisconnected: string) => {
            if (this.currentQuestion.type === QuestionType.QRL) {
                this.histogramChoices[NOT_MODIFYING].selectedCount--;
            }
            this.players = this.players.map((player) => {
                if (player.name === playerDisconnected) {
                    return { ...player, state: PlayerState.Abandoned };
                }
                return player;
            });
            this.sortList();
        });
    }

    listenCountdown() {
        this.socketService.on(SocketClientEventsListen.Countdown, (timer: number) => {
            this.time = timer;
            if (this.time === 0 && this.questionState === QuestionState.StartingNextQuestion) {
                this.socketService.send(SocketServerEventsSend.NextQuestion);
            }
        });
    }

    listenCorrectChoices() {
        this.socketService.on(SocketClientEventsListen.CorrectChoices, (correctChoices: number[]) => {
            this.histogramChoices = this.histogramChoices.map((choice, index) => ({
                ...choice,
                isCorrect: correctChoices.includes(index),
            }));
        });
    }

    listenAllSubmitted() {
        this.socketService.on(SocketClientEventsListen.ShowAnswer, () => {
            this.questionState = QuestionState.Submitted;
            this.time = 0;
            if (this.currentQuestion.type === QuestionType.QCM) {
                this.socketService.send(SocketServerEventsSend.Choices, this.histogramChoices);
            }
            this.socketService.send(SocketServerEventsSend.PlayersPoints);
        });
    }

    listenNewSelection() {
        this.socketService.on(SocketClientEventsListen.NewSelection, (playerSelection: PlayerSelection) => {
            if (this.currentQuestion.type === QuestionType.QCM) {
                this.histogramChoices[playerSelection.selection - 1].selectedCount++;
            }
            this.players = this.players.map((player) => {
                if (player.name === playerSelection.playerName) {
                    return { ...player, state: PlayerState.FirstInteraction };
                }
                return player;
            });
            this.sortList();
        });
    }

    listenNewDeselection() {
        this.socketService.on(SocketClientEventsListen.NewDeselection, (playerDeselection: PlayerDeselection) => {
            this.histogramChoices[playerDeselection.deselection - 1].selectedCount--;
            this.players = this.players.map((player) => {
                if (player.name === playerDeselection.playerName) {
                    return { ...player, state: PlayerState.FirstInteraction };
                }
                return player;
            });
            this.sortList();
        });
    }

    listenModifyQuestion() {
        this.socketService.on(SocketClientEventsListen.ModifyQuestion, (modification: boolean) => {
            const modificationIndex = modification ? MODIFYING : NOT_MODIFYING;
            const modificationIndexOther = modification ? NOT_MODIFYING : MODIFYING;
            this.histogramChoices[modificationIndex].selectedCount++;
            if (this.histogramChoices[modificationIndexOther].selectedCount > 0) {
                this.histogramChoices[modificationIndexOther].selectedCount--;
            }
        });
    }

    listenEndGame() {
        this.socketService.on(SocketClientEventsListen.EndGame, () => {
            this.isLastQuestion = true;
        });
    }

    listenNavigateToResults() {
        this.socketService.on(SocketClientEventsListen.NavigateToResults, () => {
            this.router.navigate([Routes.Results]);
        });
    }

    listenEvaluating() {
        this.socketService.on(SocketClientEventsListen.Evaluating, () => {
            this.questionState = QuestionState.Evaluating;
            this.time = 0;
            this.socketService.send(SocketServerEventsSend.EvaluateFirstPlayer);
        });
    }

    quitGame() {
        this.abandonOrganisateur = true;
        this.socketService.send(SocketServerEventsSend.LeaveLobby);
    }

    listenDisconnect() {
        this.socketService.on(SocketClientEventsListen.Disconnected, () => {
            if (!this.abandonOrganisateur)
                this.dialog.open(ErrorPopupComponent, {
                    data: { title: POPUP_ERROR, message: DISCONNECTED_EMPTY_ROOM },
                });
            this.router.navigate([Routes.Creation]);
        });
    }

    sortList(): void {
        switch (this.orderBy) {
            case SortBy.Name:
                this.playerSortingService.sortPlayersByName(this.orderAscending, this.players);
                break;
            case SortBy.Points:
                this.playerSortingService.sortPlayersByPoints(this.orderAscending, this.players);
                break;
            case SortBy.State:
                this.playerSortingService.sortPlayersByState(this.orderAscending, this.players);
                break;
        }
    }

    toggleOrderSelection(): void {
        this.orderAscending = !this.orderAscending;
        this.toggleArrow();
        this.sortList();
    }

    toggleSortSelection(sortBy: string): void {
        if (sortBy === this.orderBy) {
            this.toggleOrderSelection();
        } else {
            this.orderBy = sortBy;
            this.orderAscending = true;
            this.toggleArrow();
        }
        this.sortList();
    }

    toggleChatPermission(player: Player) {
        this.socketService.send(SocketServerEventsSend.ToggleChatPermission, player.name);
        player.canChat = !player.canChat;
    }

    toggleArrow() {
        this.arrowClass = this.orderAscending ? ARROW_UP : ARROW_DOWN;
    }
}
