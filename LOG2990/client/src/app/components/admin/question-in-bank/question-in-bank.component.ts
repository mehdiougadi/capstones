import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ContextQuestionModal, StateQuestionModal } from '@app/common-client/constant/state';
import { QuestionDisplayModalComponent } from '@app/components/admin/question-display-modal/question-display-modal.component';
import { Question } from '@common/interfaces/question';

@Component({
    selector: 'app-question-in-bank',
    templateUrl: './question-in-bank.component.html',
    styleUrls: ['./question-in-bank.component.scss'],
})
export class QuestionInBankComponent {
    @Input() question: Question;
    @Input() displayDate: boolean = true;
    constructor(private dialog: MatDialog) {}

    showModalQuestion(currentQuestion: Question): void {
        this.dialog.open(QuestionDisplayModalComponent, {
            data: {
                question: currentQuestion,
                questionState: StateQuestionModal.DISPLAY,
                questionContext: ContextQuestionModal.DEFAULT,
            },
        });
    }
}
