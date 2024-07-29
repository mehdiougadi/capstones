import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ContextQuestionModal, StateQuestionModal } from '@app/common-client/constant/state';
import { QuestionDisplayModalComponent } from '@app/components/admin/question-display-modal/question-display-modal.component';
import { QuestionManagerService } from '@app/services/managers/question-manager/question-manager.service';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';

@Component({
    selector: 'app-create-quiz',
    templateUrl: './create-quiz.component.html',
    styleUrls: ['./create-quiz.component.scss'],
})
export class CreateQuizComponent {
    questionType = QuestionType;
    constructor(
        private dialog: MatDialog,
        private quizManagerService: QuizManagerService,
        private bankQuestionService: QuestionManagerService,
    ) {}

    createQuestionInQuiz(): void {
        this.dialog.open(QuestionDisplayModalComponent, {
            data: {
                question: { _id: '', title: '', type: '', points: 0, choices: [], date: new Date() },
                questionState: StateQuestionModal.NEW,
                questionContext: ContextQuestionModal.QUIZ,
            },
        });
    }

    openQuestionInQuiz(currentQuestion: Question): void {
        this.dialog.open(QuestionDisplayModalComponent, {
            data: {
                question: currentQuestion,
                questionState: StateQuestionModal.DISPLAY,
                questionContext: ContextQuestionModal.QUIZ,
            },
        });
    }

    onQuizQuestionDrop(event: CdkDragDrop<Question[]>): void {
        this.quizManagerService.addQuestionToQuiz(this.bankQuestionService.deepCopyQuestion(event.item.data as Question));
    }

    orderQuestionInList(event: CdkDragDrop<Question[]>): void {
        const questionList = this.quizManagerService.currentQuiz.questions;
        questionList.splice(event.currentIndex, 0, questionList.splice(event.previousIndex, 1)[0]);
    }
}
