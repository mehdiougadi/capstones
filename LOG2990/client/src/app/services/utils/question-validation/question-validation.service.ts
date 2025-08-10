import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { QuestionMessage } from '@common/client-message/question-pop-up';
import { HIGHER_BOUND_POINTS, LOWER_BOUND_POINTS, MAX_MULTIPLE_CHOICES, MIN_MULTIPLE_CHOICES } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';

@Injectable({
    providedIn: 'root',
})
export class QuestionValidationService {
    constructor(private readonly dialog: MatDialog) {}

    isQuestionValid(question: Question): boolean {
        let state = false;
        if (question.type === QuestionType.QCM) {
            state =
                this.isAnswersValid(question) &&
                this.isRightAnswersValid(question) &&
                this.isWrongAnswersValid(question) &&
                this.isAnswerLengthValid(question) &&
                this.isTitleValid(question) &&
                this.isPointsValid(question);
        } else {
            state = this.isTitleValid(question) && this.isPointsValid(question);
        }
        return state;
    }

    isTitleInBank(question: Question, questionList: Question[]): boolean {
        if (
            questionList.some(
                (bankQuestion) => bankQuestion.text.trim().toLowerCase() === question.text.trim().toLowerCase() && bankQuestion._id !== question._id,
            )
        ) {
            this.openMessageDialog(QuestionMessage.QUESTION_ALREADY_EXISTS);
            return false;
        }
        return true;
    }

    private isTitleValid(question: Question): boolean {
        if (question.text.trim().length === 0) {
            this.openMessageDialog(QuestionMessage.QUESTION_TITLE_EMPTY);
            return false;
        }
        return true;
    }

    private isPointsValid(question: Question): boolean {
        if (question.points < LOWER_BOUND_POINTS || question.points % LOWER_BOUND_POINTS !== 0 || question.points > HIGHER_BOUND_POINTS) {
            this.openMessageDialog(QuestionMessage.QUESTION_POINTS_INVALID);
            return false;
        }
        return true;
    }

    private isAnswersValid(question: Question): boolean {
        if (question.choices && !question.choices.every((choice) => choice && choice.text.trim() !== '') && question.type === QuestionType.QCM) {
            this.openMessageDialog(QuestionMessage.ANSWER_TEXT_EMPTY);
            return false;
        }
        return true;
    }

    private isRightAnswersValid(question: Question): boolean {
        if (question.choices && !question.choices.some((choice) => choice && choice.isCorrect) && question.type === QuestionType.QCM) {
            this.openMessageDialog(QuestionMessage.RIGHT_ANSWER_MISSING);
            return false;
        }
        return true;
    }

    private isWrongAnswersValid(question: Question): boolean {
        if (question.choices && !question.choices.some((choice) => choice && !choice.isCorrect) && question.type === QuestionType.QCM) {
            this.openMessageDialog(QuestionMessage.WRONG_ANSWER_MISSING);
            return false;
        }
        return true;
    }

    private isAnswerLengthValid(question: Question): boolean {
        if (
            question.choices &&
            (question.choices.length < MIN_MULTIPLE_CHOICES || question.choices.length > MAX_MULTIPLE_CHOICES) &&
            question.type === QuestionType.QCM
        ) {
            this.openMessageDialog(QuestionMessage.CHOICES_LENGTH_INVALID);
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
