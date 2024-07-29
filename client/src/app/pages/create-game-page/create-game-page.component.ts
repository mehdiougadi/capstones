import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StateHeader } from '@app/common-client/constant/state';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { QuestionManagerService } from '@app/services/managers/question-manager/question-manager.service';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { IdGeneratorService } from '@app/services/utils/id-generator/id-generator.service';
import { GameMessage } from '@common/client-message/game-pop-up';
import { FIVE_SECONDS, UNIQUE_INDEX } from '@common/constant/constants';
import { Question } from '@common/interfaces/question';
import { Quiz } from '@common/interfaces/quiz';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit, OnDestroy {
    currentStateHeader: StateHeader = StateHeader.CREATE;
    selectedQuiz: Quiz | null = null;
    listQuestion: Question[];
    private quizSubscription: Subscription;

    // eslint-disable-next-line max-params
    constructor(
        private quizManagerService: QuizManagerService,
        private communicationService: GameManager,
        private gameControllerService: GameControllerService,
        private questionManagerService: QuestionManagerService,
        private idGeneratorService: IdGeneratorService,
        private dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        sessionStorage.removeItem('listeMessages');
        this.updateQuizList();
    }

    startGame(): void {
        this.gameControllerService.saveIsTesting(true);
        this.verifCreateGame(true);
    }
    masterWaitingRoom() {
        this.gameControllerService.saveIsTesting(false);
        this.verifCreateGame(false);
    }

    fetchQuizDetails(quizId: string, isTesting: boolean): void {
        this.quizSubscription = this.communicationService.getQuizById(quizId).subscribe({
            next: (quiz: Quiz) => this.handleQuizResponse(quiz, isTesting),
            error: () => this.showDialog(GameMessage.CANT_GET_QUIZZES),
        });
    }

    showDialog(message: string): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message },
        });
    }

    ngOnDestroy() {
        if (this.quizSubscription) {
            this.quizSubscription.unsubscribe();
        }
    }

    selectQuiz(game: Quiz): void {
        this.selectedQuiz = game;
    }

    startRandomMode(): void {
        const qcmQuestions = this.questionManagerService.bankQuestionList.filter((question) => question.type === 'QCM');
        const idRandomMode = this.idGeneratorService.generateId();
        if (qcmQuestions.length >= UNIQUE_INDEX) {
            this.gameControllerService.createSession(idRandomMode, false, true);
        } else {
            this.showDialog(GameMessage.INSUFFICIENT_QUESTIONS);
        }
    }

    private updateQuizList(): void {
        setTimeout(() => {
            this.quizManagerService.updateQuizList();
            this.updateQuizList();
        }, FIVE_SECONDS);
    }

    private verifCreateGame(isTesting: boolean): void {
        if (!this.selectedQuiz) {
            this.showDialog(GameMessage.CANT_GET_QUIZZES);
            return;
        }
        this.fetchQuizDetails(this.selectedQuiz._id, isTesting);
    }

    private handleQuizResponse(quiz: Quiz, isTesting: boolean): void {
        if (quiz && quiz.visible) {
            this.gameControllerService.createSession(quiz._id, isTesting, false);
        } else {
            this.showDialog(GameMessage.QUIZ_IS_UNAVAILABLE);
            this.selectedQuiz = null;
        }
    }
}
