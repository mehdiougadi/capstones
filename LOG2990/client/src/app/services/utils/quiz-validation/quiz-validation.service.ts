import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { QuizMessage } from '@common/client-message/quiz-pop-up';
import { HIGHER_BOUND_DURATION, LOWER_BOUND_DURATION } from '@common/constant/constants';
import { Quiz } from '@common/interfaces/quiz';

@Injectable({
    providedIn: 'root',
})
export class QuizValidationService {
    constructor(private readonly dialog: MatDialog) {}

    isQuizValid(quiz: Quiz, quizList: Quiz[]): boolean {
        return this.isTitleValid(quiz) && this.isDuplicateTitle(quiz, quizList) && this.isQuestionsValid(quiz) && this.isDurationValid(quiz);
    }

    isDuplicateTitle(quiz: Quiz, quizList: Quiz[]): boolean {
        if (quizList.some((bankQuiz) => bankQuiz.title.trim().toLowerCase() === quiz.title.trim().toLowerCase() && bankQuiz._id !== quiz._id)) {
            this.openMessageDialog(QuizMessage.QUIZ_ALREADY_EXISTS);
            return false;
        }
        return true;
    }
    private isTitleValid(quiz: Quiz): boolean {
        if (quiz.title.trim().length === 0 || quiz.description.trim().length === 0) {
            this.openMessageDialog(QuizMessage.QUIZ_TITLE_EMPTY);
            return false;
        }
        return true;
    }

    private isQuestionsValid(quiz: Quiz): boolean {
        if (quiz.questions.length === 0) {
            this.openMessageDialog(QuizMessage.QUIZ_NO_QUESTIONS);
            return false;
        }
        return true;
    }

    private isDurationValid(quiz: Quiz): boolean {
        if (quiz.duration < LOWER_BOUND_DURATION || quiz.duration > HIGHER_BOUND_DURATION) {
            this.openMessageDialog(QuizMessage.QUIZ_DURATION_INVALID);
            return false;
        }
        return true;
    }

    private openMessageDialog(message: string): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message },
        });
    }
}
