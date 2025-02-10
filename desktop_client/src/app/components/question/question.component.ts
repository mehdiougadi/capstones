import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FIVE_SECOND, GameMode, QuestionState, QuestionType, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { Choice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { TimeService } from '@app/services/timer/timer.service';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-question',
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit, OnChanges, OnDestroy {
    @Input() questionState: QuestionState;
    @Input() timer: number | undefined;
    @Input() question: Question;
    @Input() submittedVariableOnChange: Observable<void>;
    @Input() correctChoices: number[];
    @Input() gameMode: GameMode;
    @Input() pointsGained: number;
    @Output() getAnswerEvent;
    eventsSubscription: Subscription;
    inputAnswer: string;
    questionStateEnum;
    gameModeEnum;
    modifyingQuestion: boolean;
    timerExpiredSubscription: Subscription;

    constructor(
        private readonly socketClientService: SocketClientService,
        private readonly timerService: TimeService,
    ) {
        this.getAnswerEvent = new EventEmitter<{ answer: Choice[] | string; timerExpired: boolean }>();
        this.questionStateEnum = QuestionState;
        this.gameModeEnum = GameMode;
        this.inputAnswer = '';
        this.modifyingQuestion = false;
        this.timerExpiredSubscription = new Subscription();
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        const numericKey = parseInt(event.key, 10);
        if (this.question.type === QuestionType.QCM) {
            if (
                !isNaN(numericKey) &&
                numericKey >= 1 &&
                numericKey <= this.question.choices.length &&
                this.questionState === QuestionState.InQuestion
            ) {
                const answerIndex = numericKey - 1;
                const answer = this.question.choices[answerIndex];
                this.toggleAnswer(answer, answerIndex);
            }
        }

        if (event.key === 'Enter') {
            event.stopPropagation();
            this.submitAnswer(false);
        }
    }

    ngOnInit() {
        this.listenCountdown();
        this.timerExpiredSubscription = this.timerService.timerExpired.subscribe(() => {
            this.modifyingQuestion = false;
            this.socketClientService.send(SocketServerEventsSend.ModifyQuestion, this.modifyingQuestion);
        });
    }

    ngOnDestroy() {
        if (this.socketClientService.socket.removeAllListeners) {
            this.socketClientService.socket.removeAllListeners();
        }
        this.timerExpiredSubscription.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.timer && changes.timer.currentValue === 0 && this.questionState === QuestionState.InQuestion) {
            this.submitAnswer();
        }
    }

    toggleAnswer(choice: Choice, index: number) {
        choice.selected = !choice.selected;
        if (choice.selected) {
            this.socketClientService.send(SocketServerEventsSend.NewSelection, ++index);
        } else {
            this.socketClientService.send(SocketServerEventsSend.NewDeselection, ++index);
        }
    }

    submitAnswer(expired: boolean = false) {
        this.getAnswerEvent.emit({ answer: this.getAnswer(), timerExpired: expired });
    }

    getAnswer(): Choice[] | string {
        if (this.question.type === QuestionType.QCM) {
            return this.question.choices;
        } else {
            return this.inputAnswer;
        }
    }

    modifyAnswer() {
        if (!this.modifyingQuestion) {
            this.modifyingQuestion = true;
            this.socketClientService.send(SocketServerEventsSend.ModifyQuestion, this.modifyingQuestion);
        }
        this.timerService.startTimer(FIVE_SECOND);
    }

    listenCountdown() {
        this.socketClientService.on(SocketClientEventsListen.Countdown, (timer: number) => {
            if (timer <= 0 && this.questionState === QuestionState.InQuestion) {
                this.submitAnswer(timer <= 0);
            }
        });
    }
}
