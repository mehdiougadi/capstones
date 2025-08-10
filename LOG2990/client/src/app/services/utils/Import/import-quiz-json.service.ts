import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImportModalComponent } from '@app/components/admin/import-modal/import-modal.component';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { QuestionValidationService } from '@app/services/utils/question-validation/question-validation.service';
import { QuizValidationService } from '@app/services/utils/quiz-validation/quiz-validation.service';
import { ImportMessage } from '@common/client-message/import-pop-up';
import { QuestionType } from '@common/constant/state';
import { Answer } from '@common/interfaces/answer';
import { Question } from '@common/interfaces/question';
import { Quiz } from '@common/interfaces/quiz';

@Injectable({
    providedIn: 'root',
})
export class ImportQuizJsonService {
    // eslint-disable-next-line max-params
    constructor(
        private dialog: MatDialog,
        private quizManagerService: QuizManagerService,
        private readonly questionValidationService: QuestionValidationService,
        private readonly quizValidationService: QuizValidationService,
    ) {}

    async isImportValid(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            if (!file.name.endsWith('.json')) {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: ImportMessage.QUIZ_NOTJSON_TYPE },
                });
                resolve(false);
            }
            const reader = new FileReader();
            reader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
                resolve(this.handleLoadEnd(readerEvent));
            };
            reader.readAsText(file, 'UTF-8');
        });
    }

    createQuiz(jsonObject: Quiz, newName: string): boolean {
        if (newName !== '') {
            jsonObject.title = newName;
        }
        if (!this.isQuizDefined(jsonObject)) {
            return false;
        }
        this.saveCurrentQuiz(jsonObject);
        return this.quizValidationService.isQuizValid(this.quizManagerService.currentQuiz, this.quizManagerService.quizList);
    }

    private handleLoadEnd(readerEvent: ProgressEvent<FileReader>): boolean {
        if (readerEvent?.target?.result) {
            return this.createQuiz(JSON.parse(readerEvent.target.result.toString()), '');
        } else {
            this.dialog.open(MessageDialogComponent, {
                data: { message: ImportMessage.QUIZ_IS_EMPTY },
            });
            return false;
        }
    }

    private saveCurrentQuiz(jsonObject: Quiz) {
        this.quizManagerService.currentQuiz.title = jsonObject.title;
        this.quizManagerService.currentQuiz.description = jsonObject.description;
        this.quizManagerService.currentQuiz.duration = jsonObject.duration;
        this.quizManagerService.currentQuiz.visible = false;
    }

    private createQuestionArray(questionArray: Question[]): boolean {
        for (const question of questionArray) {
            if (!this.isQuestionDefined(question)) {
                return false;
            }
            const tempQuestion: Question = {
                _id: '',
                text: question.text,
                type: question.type,
                points: question.points,
                choices: [],
                date: new Date(),
            };
            if (question.type === QuestionType.QCM) {
                tempQuestion.choices = this.createChoiceArray(question.choices);
            }
            if (!this.questionValidationService.isQuestionValid(tempQuestion)) {
                return false;
            }
            this.quizManagerService.addQuestionToQuiz(tempQuestion);
        }
        return true;
    }

    private validateTypeChoiceArray(choices: Answer[]): boolean {
        for (const choice of choices) {
            if (!this.isChoiceDefined(choice)) {
                return false;
            }
        }
        return true;
    }

    private createChoiceArray(choices: Answer[]): Answer[] {
        const tempChoiceArray: Answer[] = [];
        for (const choice of choices) {
            tempChoiceArray.push({
                text: choice.text,
                isCorrect: choice.isCorrect,
            });
        }
        return tempChoiceArray;
    }

    private isQuizDefined(quiz: Quiz): boolean {
        return (
            this.isTitleDefined(quiz) &&
            this.isTitleUnique(quiz) &&
            this.isDescriptionDefined(quiz) &&
            this.isQuestionsDefined(quiz) &&
            this.isDurationDefined(quiz) &&
            this.createQuestionArray(quiz.questions)
        );
    }

    private isTitleDefined(quiz: Quiz): boolean {
        if (typeof quiz.title !== 'string') {
            this.openMessageDialog(ImportMessage.QUIZ_TITLE_TYPE);
            return false;
        }
        return true;
    }

    private isTitleUnique(quiz: Quiz): boolean {
        if (!this.isUnique(quiz)) {
            this.dialog.open(ImportModalComponent, { data: { quiz } });
            return false;
        }
        return true;
    }

    private isUnique(quiz: Quiz) {
        return !this.quizManagerService.quizList.some(
            (bankQuiz) => bankQuiz.title.trim().toLocaleLowerCase() === quiz.title.trim().toLocaleLowerCase(),
        );
    }

    private isDescriptionDefined(quiz: Quiz): boolean {
        if (typeof quiz.description !== 'string') {
            this.openMessageDialog(ImportMessage.QUIZ_DESCRIPTION_TYPE);
            return false;
        }
        return true;
    }

    private isQuestionsDefined(quiz: Quiz): boolean {
        if (!Array.isArray(quiz.questions)) {
            this.openMessageDialog(ImportMessage.QUIZ_QUESTIONS_TYPE);
            return false;
        }
        return true;
    }

    private isDurationDefined(quiz: Quiz): boolean {
        if (typeof quiz.duration !== 'number') {
            this.openMessageDialog(ImportMessage.QUIZ_DURATION_TYPE);
            return false;
        }
        return true;
    }

    private isQuestionDefined(question: Question): boolean {
        if (!this.isQuestionTypeDefined(question)) return false;

        if (!this.isQuestionTextDefined(question) || !this.isQuestionPointsDefined(question)) return false;

        if (question.type === QuestionType.QCM) {
            if (!this.isQuestionChoicesDefined(question) || !this.validateTypeChoiceArray(question.choices)) return false;
        } else {
            if (!this.choiceNotDefined(question)) {
                this.openMessageDialog(ImportMessage.QRL_CHOICES);
                return false;
            }
        }

        return true;
    }

    private choiceNotDefined(question: Question): boolean {
        return question.choices === undefined || question.choices.length === 0;
    }

    private isQuestionTextDefined(question: Question): boolean {
        if (typeof question.text !== 'string') {
            this.openMessageDialog(ImportMessage.QUESTION_TEXT_TYPE);
            return false;
        }
        return true;
    }

    private isQuestionTypeDefined(question: Question): boolean {
        if (!(question.type in QuestionType)) {
            this.openMessageDialog(ImportMessage.QUESTION_TYPE);
            return false;
        }
        return true;
    }

    private isQuestionPointsDefined(question: Question): boolean {
        if (typeof question.points !== 'number') {
            this.openMessageDialog(ImportMessage.QUESTION_POINTS_TYPE);
            return false;
        }
        return true;
    }

    private isQuestionChoicesDefined(question: Question): boolean {
        if (!Array.isArray(question.choices)) {
            this.openMessageDialog(ImportMessage.QUESTION_CHOICES_TYPE);
            return false;
        }
        return true;
    }

    private isChoiceDefined(choice: Answer): boolean {
        return this.isChoiceTextDefined(choice) && this.isChoiceIsCorrectDefined(choice);
    }

    private isChoiceTextDefined(choice: Answer): boolean {
        if (typeof choice.text !== 'string') {
            this.openMessageDialog(ImportMessage.CHOICE_TEXT_TYPE);
            return false;
        }
        return true;
    }

    private isChoiceIsCorrectDefined(choice: Answer): boolean {
        if (typeof choice.isCorrect !== 'boolean') {
            this.openMessageDialog(ImportMessage.CHOICE_ISCORRECT_TYPE);
            return false;
        }
        return true;
    }

    private openMessageDialog(message: string): void {
        this.dialog.open(MessageDialogComponent, { data: { message } });
    }
}
