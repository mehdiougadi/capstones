import { Injectable } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { KeyboardService } from '@app/services/controllers/keyboard-controller/keyboard-controller.service';
import { MouseControllerService } from '@app/services/controllers/mouse-controller/mouse-controller.service';
import { Player } from '@common/classes/player';
import { Answer } from '@common/interfaces/answer';
import { Subject } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class SendAnswersService {
    private subscriptions: Subscriptions = {};
    private room: Room;
    private isQcm: boolean = false;
    private currentPlayer: Player;
    private choiceArray: Answer[] = [];
    private qrlAnswer: string = '';

    // Pour les eslint, On veut mettre les subject priver mais si on met les attributs
    // public avant, il ne savent pas c'est quoi l'attribut priver
    private confirmChoiceSubject = new Subject<boolean>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    confirmChoice$ = this.confirmChoiceSubject.asObservable();
    constructor(
        private keyboardService: KeyboardService,
        private mouseControllerService: MouseControllerService,
        private gameControllerService: GameControllerService,
    ) {}
    setAttributes(room: Room, currentPlayer: Player): void {
        this.room = room;
        this.currentPlayer = currentPlayer;
    }
    setChoices(answers: Answer[]): void {
        this.choiceArray = answers;
        this.isQcm = true;
    }

    setQrlAnswer(answer: string): void {
        this.qrlAnswer = answer;
        this.isQcm = false;
    }

    keyboardSubscriptionFunction(): void {
        this.subscriptions.keyboardSubscription = this.keyboardService.enterPressed$.subscribe(() => {
            this.verificationAnswersSubscriptionMethod();
        });
    }
    mouseSubscription(): void {
        this.subscriptions.mouseClickSubscription = this.mouseControllerService.leftClick$.subscribe(() => {
            this.verificationAnswersSubscriptionMethod();
        });
    }

    verificationAnswersSubscriptionMethod(): void {
        this.unsubscribeKeyboard();
        this.unsubscribeMouse();
        this.subscribeToQuestionType();
        this.confirmChoiceSubject.next(true);
    }

    subscribeToQuestionType(): void {
        if (this.isQcm) {
            this.subscribeToVerificationAnswers();
        } else {
            this.subscribeToSetQrlAnswer();
        }
    }
    unsubscribeKeyboard(): void {
        this.subscriptions.keyboardSubscription?.unsubscribe();
    }
    unsubscribeMouse(): void {
        this.subscriptions.mouseClickSubscription?.unsubscribe();
    }
    blockAnswers(): void {
        this.unsubscribeKeyboard();
        this.unsubscribeMouse();
    }
    unsubscribeVerificationAnswers(): void {
        this.subscriptions.verificationAnswersSubscription?.unsubscribe();
    }

    unsubscribeSetQrlAnswer(): void {
        this.subscriptions.setQrlAnswerSubscription?.unsubscribe();
    }

    subscribeToVerificationAnswers(): void {
        this.unsubscribeVerificationAnswers();
        this.subscriptions.verificationAnswersSubscription = this.gameControllerService
            .verificationAnswers(this.room.id, this.currentPlayer.name, this.choiceArray)
            .subscribe({});
    }

    subscribeToSetQrlAnswer(): void {
        this.unsubscribeSetQrlAnswer();
        this.subscriptions.setQrlAnswerSubscription = this.gameControllerService
            .setQrlAnswer(this.room.id, this.currentPlayer.name, this.qrlAnswer)
            .subscribe({});
    }
}
