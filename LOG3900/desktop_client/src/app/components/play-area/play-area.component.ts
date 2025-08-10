import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
    BONUS_MESSAGE,
    DISCONNECTED_POPUP,
    GameMode,
    ORGANIZER_LEFT_POPUP,
    POPUP_WARNING,
    QuestionState,
    QuestionType,
    Routes,
    SocketClientEventsListen,
    SocketServerEventsSend,
} from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { QuestionComponent } from '@app/components/question/question.component';
import { Points } from '@app/interfaces/answer-points';
import { AnswerSubmit } from '@app/interfaces/answer-submit';
import { Choice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit, OnDestroy {
    @ViewChild('question') questionComponent!: QuestionComponent;
    @Input() gameId: string;
    @Input() gameMode: GameMode;
    @Input() selected: Choice[];
    questionStateEnum;
    timer: number | undefined;
    totalPoints: number;
    correctAnswerMessage: string;
    questions: Question[];
    correctChoices: number[];
    hasBonus: boolean;
    countdownValue: number;
    currentQuestion: Question;
    questionState: QuestionState;
    pointsGained: number;
    private answers: Choice[] | string;
    private lastQuestion: boolean;
    private abandon: boolean;
    private audio: HTMLAudioElement;

    constructor(
        private readonly socketClientService: SocketClientService,
        private readonly router: Router,
        private readonly dialog: MatDialog,
    ) {
        this.questionStateEnum = QuestionState;
        this.totalPoints = 0;
        this.correctAnswerMessage = BONUS_MESSAGE;
        this.questions = [];
        this.correctChoices = [];
        this.questionState = QuestionState.InQuestion;
        this.lastQuestion = false;
        this.abandon = false;
        this.pointsGained = 0;
        this.currentQuestion = {
            text: '',
            choices: [],
            points: 0,
            type: QuestionType.QCM,
        };
        this.audio = new Audio('assets/soundEffects/secTimer.mp3');
    }

    ngOnInit() {
        this.socketClientService.send(SocketServerEventsSend.RequestRoomId);
        this.socketClientService.on(SocketClientEventsListen.RoomId, async (roomId: string) => {
            if (roomId) {
                if (this.gameMode === GameMode.Test) {
                    this.testInit();
                }
                this.listenNewQuestion();
                this.listenCountDown();
                this.listenShowAnswer();
                this.listenPoints();
                this.requestFirstQuestion();
                this.listenForNavigateResults();
                this.handleDisconnect();
                this.listenEvaluating();
                this.listenPanicMode();
            } else {
                if (this.gameMode === GameMode.Test) {
                    this.router.navigate([Routes.Creation]);
                } else {
                    this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: DISCONNECTED_POPUP } });
                    this.router.navigate([Routes.Home]);
                }
            }
        });
    }

    ngOnDestroy() {
        this.socketClientService.socket.removeAllListeners();
    }

    testInit() {
        this.socketClientService.send(SocketServerEventsSend.JoinRoom, this.gameMode);
        this.socketClientService.send(SocketServerEventsSend.LockLobby, true);
        this.socketClientService.send(SocketServerEventsSend.StartGame);
        this.socketClientService.on(SocketClientEventsListen.EndGame, () => {
            this.lastQuestion = true;
        });
        this.socketClientService.on(SocketClientEventsListen.EvaluatePlayer, () => {
            const playerScore: Points = { name: this.gameMode, points: 100 };
            this.socketClientService.send(SocketServerEventsSend.EvaluateNextPlayer, { points: playerScore, isInTest: true });
        });
        this.socketClientService.on(SocketClientEventsListen.Evaluating, () => {
            this.socketClientService.send(SocketServerEventsSend.EvaluateFirstPlayer);
        });
    }

    requestFirstQuestion() {
        this.socketClientService.send(SocketServerEventsSend.FirstQuestion);
    }

    listenCountDown() {
        this.socketClientService.on(SocketClientEventsListen.Countdown, (countdown: number) => {
            if (this.gameMode === GameMode.Test && this.questionState === QuestionState.ShowAnswers && countdown === 0) {
                if (this.lastQuestion) {
                    this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
                    this.router.navigate([Routes.Creation]);
                } else {
                    this.socketClientService.send(SocketServerEventsSend.NextQuestion);
                }
            }
            if (this.questionState !== QuestionState.Submitted) {
                this.timer = countdown;
            }
        });
    }

    listenPanicMode() {
        this.socketClientService.on(SocketClientEventsListen.PanicMode, () => {
            this.audio.play();
            this.audio.loop = true;
        });
    }

    listenNewQuestion() {
        this.socketClientService.on(SocketClientEventsListen.NewQuestion, (question: Question) => {
            this.currentQuestion = question;
            this.questionState = QuestionState.InQuestion;
            if (this.currentQuestion.type === QuestionType.QCM) {
                this.answers = [];
            } else {
                this.questionComponent.inputAnswer = '';
                this.answers = '';
            }
        });
    }

    handleAnswer(data: { answer: Choice[] | string; timerExpired: boolean }) {
        const answerTime = data.timerExpired ? Infinity : new Date().getTime();
        this.answers = data.answer;
        this.timer = undefined;
        this.submitAnswer(answerTime);
    }

    submitAnswer(answerTime: number) {
        let answerToSend: number[] | string;
        if (this.questionState === QuestionState.InQuestion) {
            answerToSend = [];
            if (this.currentQuestion.type === QuestionType.QCM) {
                (this.answers as Choice[]).forEach((choice, index) => {
                    if (choice.selected) {
                        (answerToSend as number[]).push(index);
                    }
                });
                this.socketClientService.send(SocketServerEventsSend.SubmitAnswerQcm, new AnswerSubmit(answerTime, answerToSend));
            } else {
                answerToSend = this.answers as string;
                this.socketClientService.send(SocketServerEventsSend.SubmitAnswerQrl, new AnswerSubmit(answerTime, answerToSend));
            }
            this.questionState = QuestionState.Submitted;
        }
    }

    listenEvaluating() {
        this.socketClientService.on(SocketClientEventsListen.Evaluating, () => {
            this.pauseAudio();
            this.questionState = QuestionState.Evaluating;
        });
    }

    listenShowAnswer() {
        this.socketClientService.on(SocketClientEventsListen.ShowAnswer, (correctChoices: number[]) => {
            this.pauseAudio();
            this.correctChoices = correctChoices;
            this.socketClientService.send(SocketServerEventsSend.Points);
        });
    }

    listenPoints() {
        this.socketClientService.on(SocketClientEventsListen.Points, (answerPoints: Points) => {
            this.pointsGained = answerPoints.points - this.totalPoints;
            this.totalPoints = answerPoints.points;
            this.hasBonus = answerPoints.hasBonus ? answerPoints.hasBonus : false;
            this.questionState = QuestionState.ShowAnswers;
            if (this.gameMode === GameMode.Test) {
                this.socketClientService.send(SocketServerEventsSend.NextQuestionCountdown);
            }
        });
    }

    listenForNavigateResults() {
        this.socketClientService.on(SocketClientEventsListen.NavigateToResults, () => {
            this.router.navigate([Routes.Results]);
        });
    }

    handleDisconnect() {
        this.socketClientService.on(SocketClientEventsListen.Disconnected, () => {
            if (this.gameMode === GameMode.Player && !this.abandon) {
                this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: ORGANIZER_LEFT_POPUP } });
            }
            this.router.navigate(this.gameMode === GameMode.Test ? [Routes.Creation] : [Routes.Home]);
        });
    }

    abandonGame() {
        if (this.currentQuestion.type === QuestionType.QCM) {
            (this.questionComponent.getAnswer() as Choice[]).forEach((choice, index) => {
                if (choice.selected) {
                    this.socketClientService.send(SocketServerEventsSend.NewDeselection, ++index);
                }
            });
        } else if (this.questionComponent.modifyingQuestion) {
            this.socketClientService.send(SocketServerEventsSend.ModifyQuestion, !this.questionComponent.modifyingQuestion);
        }
        this.abandon = true;

        this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
    }

    private pauseAudio() {
        this.audio.pause();
        this.audio.loop = false;
        this.audio.currentTime = 0;
    }
}
