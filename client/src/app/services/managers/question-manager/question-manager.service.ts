import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { IdGeneratorService } from '@app/services/utils/id-generator/id-generator.service';
import { QuestionValidationService } from '@app/services/utils/question-validation/question-validation.service';
import { QuestionMessage } from '@common/client-message/question-pop-up';
import { Question } from '@common/interfaces/question';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class QuestionManagerService {
    bankQuestionList: Question[] = [];
    private readonly baseUrlForQuestion: string = environment.serverUrl + '/question';

    // eslint-disable-next-line max-params
    constructor(
        private readonly http: HttpClient,
        private idGeneratorService: IdGeneratorService,
        private dialog: MatDialog,
        private questionValidationService: QuestionValidationService,
    ) {
        this.updateQuestionsList();
    }

    updateQuestionsList(): void {
        this.http.get<Question[]>(this.baseUrlForQuestion).subscribe((updatedList) => (this.bankQuestionList = updatedList));
    }

    addQuestionToDB(question: Question): boolean {
        if (this.verifyQuestion(question)) {
            question._id = this.idGeneratorService.generateId();
            this.http
                .post<Question[]>(this.baseUrlForQuestion, { ...question, date: question.date.toISOString() })
                .subscribe((newbankQuestionList) => {
                    this.bankQuestionList = newbankQuestionList;
                });
            this.openMessageDialog(QuestionMessage.CREATE_QUESTION_SUCCESS);
            return true;
        }
        return false;
    }

    deleteQuestionFromDB(id: string): void {
        this.http.delete(`${this.baseUrlForQuestion}/${id}`).subscribe({
            next: () => {
                this.updateQuestionsList();
                this.openMessageDialog(QuestionMessage.DELETE_QUESTION_SUCCESS);
            },
            error: () => {
                this.openMessageDialog(QuestionMessage.DELETE_QUESTION_FAIL);
            },
        });
    }

    modifyQuestionFromDB(modifiedQuestion: Question): boolean {
        if (this.verifyQuestion(modifiedQuestion)) {
            this.http.put<Question>(`${this.baseUrlForQuestion}/${modifiedQuestion._id}`, modifiedQuestion).subscribe(() => {
                this.updateQuestionsList();
            });
            this.openMessageDialog(QuestionMessage.MODIFY_QUESTION_SUCCESS);
            return true;
        }
        return false;
    }

    deepCopyQuestion<Question>(obj: Question): Question {
        return JSON.parse(JSON.stringify(obj));
    }

    verifyQuestion(question: Question): boolean {
        return (
            this.questionValidationService.isTitleInBank(question, this.bankQuestionList) && this.questionValidationService.isQuestionValid(question)
        );
    }

    private openMessageDialog(message: string): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message },
        });
    }
}
