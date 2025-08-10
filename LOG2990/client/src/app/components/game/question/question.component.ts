import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { InputQuestion } from '@app/common-client/interfaces/input-question';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { KeyboardService } from '@app/services/controllers/keyboard-controller/keyboard-controller.service';
import { SendAnswersService } from '@app/services/controllers/sendAnswers/send-answers.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { FIVE_SECONDS, GREEN, HANDLE_QUESTION_INDEX, LOWER_BOUND, QRL_ANSWER_LIMIT, YELLOW } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Answer } from '@common/interfaces/answer';

@Component({
    selector: 'app-question',
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit, OnDestroy {
    @Input() inputQuestion: InputQuestion;

    confirmChoices: boolean = false;
    userResponse: string;
    characterCount: number;
    buttonPressed = '';

    private currentTime: number = 0;
    private onlyOnce: number = 0;
    private selectedOptions: Answer[] = [];
    private subscriptions: Subscriptions = {};
    private resetTimer: ReturnType<typeof setTimeout>;
    // eslint-disable-next-line max-params
    constructor(
        private sendAnswersService: SendAnswersService,
        private keyboardService: KeyboardService,
        private gameConnectionSocket: GameConnectionSocketService,
        private gameControllerService: GameControllerService,
        private roomManagerService: RoomManagerService,
    ) {}
    @HostListener('keydown', ['$event'])
    buttonDetect(event: KeyboardEvent): void {
        this.buttonPressed = event.key;
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (!this.gameControllerService.isInputFocused) {
            this.keyboardService.handleKeyboardEventGameplay(event);
        }
        if (this.confirmChoices && !this.gameControllerService.isInputFocused) {
            this.inputQuestion.currentPlayer.interaction = GREEN;
            this.roomManagerService.sendUpdatedInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
        }
        if (this.confirmChoices || this.inputQuestion.room.roundFinished || this.gameControllerService.isInputFocused) {
            return;
        }
        if (this.inputQuestion.question.type === QuestionType.QCM) {
            this.handleQCMQuestion(event);
        }

        if (this.inputQuestion.question.type === QuestionType.QRL) {
            this.checkCharacterLimit(event);
        }
    }

    ngOnInit(): void {
        this.characterCount = QRL_ANSWER_LIMIT;
        this.subscribeToGameStageChanges();
        this.initializeSendAnswersService();
        this.subscribeToChoices();
        this.roomManagerService.sendQrlInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
    }

    choiceSubscriptionFunction(): void {
        this.subscriptions.choicesSubscription = this.sendAnswersService.confirmChoice$.subscribe((confirmChoice: boolean) => {
            this.confirmChoices = confirmChoice;
        });
    }
    getClassForOption(option: Answer): string {
        if (!this.inputQuestion.room.roundFinished) {
            return this.isSelectedOption(option) ? 'button-selected' : 'button-unselected';
        }
        if (option.isCorrect) {
            return 'correct-answer';
        }
        return this.isSelectedOption(option) ? 'incorrect-answer' : 'button-unselected';
    }

    selectOption(option: Answer): void {
        const index = this.selectedOptions.indexOf(option);
        this.inputQuestion.currentPlayer.interaction = YELLOW;
        this.roomManagerService.sendUpdatedInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
        if (index === LOWER_BOUND) {
            this.selectedOptions.push(option);
            this.gameConnectionSocket.sendStatsUpdate(this.inputQuestion.room.id, option, 1);
        } else {
            this.selectedOptions.splice(index, 1);
            this.gameConnectionSocket.sendStatsUpdate(this.inputQuestion.room.id, option, 0);
        }
        this.sendAnswersService.setChoices(this.selectedOptions);
    }

    checkCharacterLimit(event: Event): void {
        this.userResponse = (event.target as HTMLTextAreaElement).value;
        this.characterCount = QRL_ANSWER_LIMIT - this.userResponse.length;
        this.qrlAnswerChange();
        if (this.characterCount < 0) {
            this.characterCount = 0;
            this.userResponse = this.userResponse.slice(0, QRL_ANSWER_LIMIT);
        }
        this.inputQuestion.currentPlayer.interaction = YELLOW;
        this.roomManagerService.sendUpdatedInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
        this.sendAnswersService.setQrlAnswer(this.userResponse);
        this.manageTimer();
    }

    qrlAnswerChange(): void {
        if (this.currentTime <= 1 && this.onlyOnce < 1) {
            this.gameConnectionSocket.sendStatsUpdateQRL(this.inputQuestion.room.id, this.inputQuestion.room.currentQuestionIndex);
            this.onlyOnce = 1;
        }
    }
    onInputFocus(): void {
        this.gameControllerService.isInputFocused = true;
    }

    onInputBlur(): void {
        this.gameControllerService.isInputFocused = false;
    }
    ngOnDestroy(): void {
        this.sendAnswersService?.unsubscribeVerificationAnswers();
        this.subscriptions.gameStageSubscription?.unsubscribe();
        this.sendAnswersService?.unsubscribeKeyboard();
        this.sendAnswersService?.unsubscribeMouse();
        this.subscriptions.choicesSubscription?.unsubscribe();
    }
    private isSelectedOption(option: Answer): boolean {
        return this.selectedOptions.includes(option);
    }

    private manageTimer(): void {
        if (!this.inputQuestion.currentPlayer.hasInteracted) {
            this.inputQuestion.currentPlayer.hasInteracted = true;
            this.roomManagerService.sendQrlInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
            this.resetTimer = setTimeout(() => {
                this.inputQuestion.currentPlayer.hasInteracted = false;
                this.roomManagerService.sendQrlInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
            }, FIVE_SECONDS);
        } else {
            clearTimeout(this.resetTimer);
            this.resetTimer = setTimeout(() => {
                this.inputQuestion.currentPlayer.hasInteracted = false;
                this.roomManagerService.sendQrlInteraction(this.inputQuestion.room.id, this.inputQuestion.currentPlayer);
            }, FIVE_SECONDS);
        }
    }

    private resetAnswer(): void {
        if (this.inputQuestion.question.type === QuestionType.QCM) {
            this.selectedOptions = [];
            this.sendAnswersService.setChoices(this.selectedOptions);
        }
        if (this.inputQuestion.question.type === QuestionType.QRL) {
            this.userResponse = '';
            this.characterCount = QRL_ANSWER_LIMIT;
            this.sendAnswersService.setQrlAnswer(this.userResponse);
        }
    }

    private handleGameStageChanges(state: string): void {
        switch (state) {
            case GameState.NEXT_ROUND:
                this.resetAnswer();
                this.handleNextRound();
                break;
            case GameState.SEND_ANSWERS:
                this.handleSendAnswerRound();
                break;
            case GameState.END_ROUND:
                this.handleEndRound();
                break;
            case GameState.FINAL_END_ROUND:
                this.handleEndRound();
                break;
        }
    }
    private handleSendAnswerRound(): void {
        if (!this.confirmChoices) {
            this.handleSendAnswers();
        }
        this.sendAnswersService?.blockAnswers();
    }
    private handleQCMQuestion(event: KeyboardEvent): void {
        const key = event.key;
        const index = parseInt(key, HANDLE_QUESTION_INDEX);

        if (!isNaN(index) && index > 0 && index <= this.inputQuestion.question.choices.length) {
            const selectedOption = this.inputQuestion.question.choices[index - 1];
            this.selectOption(selectedOption);
        }
    }
    private subscribeToGameStageChanges(): void {
        this.subscriptions.gameStageSubscription = this.gameConnectionSocket.gameStageSubject$.subscribe((state: string) => {
            this.handleGameStageChanges(state);
        });
    }

    private handleNextRound(): void {
        this.confirmChoices = false;
        this.sendAnswersService.keyboardSubscriptionFunction();
        this.sendAnswersService.mouseSubscription();
    }

    private handleSendAnswers(): void {
        this.sendAnswersService.verificationAnswersSubscriptionMethod();
    }

    private handleEndRound(): void {
        this.sendAnswersService.blockAnswers();
    }

    private initializeSendAnswersService(): void {
        this.sendAnswersService.setAttributes(this.inputQuestion.room, this.inputQuestion.currentPlayer);
    }

    private subscribeToChoices(): void {
        if (this.inputQuestion.room.isTesting) {
            this.sendAnswersService.keyboardSubscriptionFunction();
            this.sendAnswersService.mouseSubscription();
        }
        this.choiceSubscriptionFunction();
    }
}
