import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContextQuestionModal, StateQuestionModal } from '@app/common-client/constant/state';
import { QuestionDisplayModalData } from '@app/common-client/interfaces/question-display-modal-data';
import { QuestionManagerService } from '@app/services/managers/question-manager/question-manager.service';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { QuestionValidationService } from '@app/services/utils/question-validation/question-validation.service';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';

@Component({
    selector: 'app-question-display-modal',
    templateUrl: './question-display-modal.component.html',
    styleUrls: ['./question-display-modal.component.scss'],
})
export class QuestionDisplayModalComponent {
    modalState = StateQuestionModal;
    questionType = QuestionType;
    modalContext = ContextQuestionModal;
    currentState: StateQuestionModal;
    currentContext: ContextQuestionModal;
    currentQuestion: Question;
    isAddedToDB: boolean;
    qrlAnswer: string = '';
    private originalQuestion: Question;

    // eslint-disable-next-line max-params
    constructor(
        @Inject(MAT_DIALOG_DATA) data: QuestionDisplayModalData,
        private dialogRef: MatDialogRef<QuestionDisplayModalComponent>,
        private bankQuestionService: QuestionManagerService,
        private quizManagerService: QuizManagerService,
        private questionValidationService: QuestionValidationService,
    ) {
        this.currentQuestion = data.question;
        this.currentContext = data.questionContext;
        this.currentState = data.questionState;
        this.originalQuestion = { ...data.question };
    }

    changeCurrentState(): void {
        switch (this.currentState) {
            case this.modalState.EDIT:
                this.currentQuestion = { ...this.originalQuestion };
                this.currentState = this.modalState.DISPLAY;
                break;
            case this.modalState.DISPLAY:
                this.currentQuestion = { ...this.originalQuestion };
                this.currentState = this.modalState.EDIT;
                break;
        }
    }

    createQuestion(): void {
        this.updateQuestionDate();
        if (this.currentContext === ContextQuestionModal.DEFAULT) {
            this.handleDefaultContextCreate();
        } else if (this.currentContext === ContextQuestionModal.QUIZ && this.questionValidationService.isQuestionValid(this.currentQuestion)) {
            this.handleQuizContextCreate();
        }
    }

    editQuestion(): void {
        this.updateQuestionDate();
        if (this.currentContext === ContextQuestionModal.DEFAULT) {
            this.handleDefaultContextEdit();
        } else if (this.currentContext === ContextQuestionModal.QUIZ && this.questionValidationService.isQuestionValid(this.currentQuestion)) {
            this.handleQuizContextEdit();
        }
    }

    deleteQuestion(): void {
        if (this.currentContext === ContextQuestionModal.DEFAULT) {
            this.bankQuestionService.deleteQuestionFromDB(this.currentQuestion._id);
        } else if (this.currentContext === ContextQuestionModal.QUIZ) {
            this.quizManagerService.deleteQuestionFromQuiz(this.currentQuestion);
        }
        this.dialogRef.close();
    }

    incrementMultipleChoice(): void {
        this.currentQuestion.choices.push({ text: '', isCorrect: false });
    }

    decrementMultipleChoice(index: number): void {
        this.currentQuestion.choices.splice(index, 1);
    }

    reOrderQcmAnswers(event: CdkDragDrop<string[]>): void {
        this.currentQuestion.choices.splice(event.currentIndex, 0, this.currentQuestion.choices.splice(event.previousIndex, 1)[0]);
    }

    updateQuestionDate(): void {
        this.currentQuestion.date = new Date();
    }

    handleDefaultContextCreate(): void {
        if (this.bankQuestionService.addQuestionToDB(this.currentQuestion)) {
            this.dialogRef.close();
        }
    }

    handleDefaultContextEdit(): void {
        if (this.bankQuestionService.modifyQuestionFromDB(this.currentQuestion)) {
            this.dialogRef.close();
        }
    }

    handleQuizContextCreate(): void {
        if (this.isAddedToDB) {
            this.bankQuestionService.addQuestionToDB(this.currentQuestion);
        }
        this.quizManagerService.addQuestionToQuiz(this.currentQuestion);
        this.dialogRef.close();
    }

    handleQuizContextEdit(): void {
        if (this.isAddedToDB) {
            this.bankQuestionService.addQuestionToDB(this.currentQuestion);
        }
        this.quizManagerService.modifyQuestionFromQuiz(this.currentQuestion);
        this.dialogRef.close();
    }
}
