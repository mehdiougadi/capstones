import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { ContextQuestionModal, StateQuestionModal } from '@app/common-client/constant/state';
import { QuestionDisplayModalComponent } from '@app/components/admin/question-display-modal/question-display-modal.component';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { QuestionInBankComponent } from './question-in-bank.component';

describe('QuestionInBankComponent', () => {
    let component: QuestionInBankComponent;
    let fixture: ComponentFixture<QuestionInBankComponent>;
    let mockQuestion: Question;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionInBankComponent],
            imports: [MatDialogModule],
        });
        fixture = TestBed.createComponent(QuestionInBankComponent);
        component = fixture.componentInstance;
        mockQuestion = {
            _id: 'TESTID',
            type: QuestionType.QCM,
            text: 'Wow quelle belle question',
            points: 30,
            choices: [],
            date: new Date(),
        };
        component.question = mockQuestion;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open the question display modal with correct data', () => {
        const dialogSpy = spyOn(component['dialog'], 'open');
        component.showModalQuestion(mockQuestion);
        expect(dialogSpy).toHaveBeenCalledWith(QuestionDisplayModalComponent, {
            data: {
                question: mockQuestion,
                questionState: StateQuestionModal.DISPLAY,
                questionContext: ContextQuestionModal.DEFAULT,
            },
        });
    });
});
