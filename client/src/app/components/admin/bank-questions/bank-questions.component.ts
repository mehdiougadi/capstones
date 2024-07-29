import { Component } from '@angular/core';
import { QuestionManagerService } from '@app/services/managers/question-manager/question-manager.service';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';

@Component({
    selector: 'app-bank-questions',
    templateUrl: './bank-questions.component.html',
    styleUrls: ['./bank-questions.component.scss'],
})
export class BankQuestionsComponent {
    questionType = QuestionType;
    showQRL: boolean = true;
    showQCM: boolean = true;

    constructor(private questionManagerService: QuestionManagerService) {}

    sortListQuestion(): Question[] {
        return this.questionManagerService.bankQuestionList
            .filter((question) => question.date)
            .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });
    }
}
