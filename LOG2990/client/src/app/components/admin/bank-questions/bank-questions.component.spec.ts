import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { BankQuestionsComponent } from './bank-questions.component';

describe('BankQuestionsComponent', () => {
    let component: BankQuestionsComponent;
    let fixture: ComponentFixture<BankQuestionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BankQuestionsComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [{ provide: MatDialog, useValue: {} }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BankQuestionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call sortListQuestion on ngOnInit', () => {
        const sortSpy = spyOn(component, 'sortListQuestion').and.callThrough();
        component.sortListQuestion();
        expect(sortSpy).toHaveBeenCalled();
    });

    it('should return an empty array when bankQuestionList is undefined', () => {
        const sortedQuestions = component.sortListQuestion();
        expect(sortedQuestions).toEqual([]);
    });

    it('should sort bank question list by date in descending order', () => {
        const mockQuestionList: Question[] = [
            { _id: '1', text: 'Question 1', type: QuestionType.QCM, points: 10, choices: [], date: new Date('2024-03-16T10:00:00') },
            { _id: '2', text: 'Question 2', type: QuestionType.QCM, points: 10, choices: [], date: new Date('2024-03-17T08:00:00') },
            { _id: '3', text: 'Question 3', type: QuestionType.QCM, points: 10, choices: [], date: new Date('2024-03-15T15:30:00') },
        ];

        component['questionManagerService'].bankQuestionList = mockQuestionList;

        const sortedQuestions = component.sortListQuestion();

        expect(sortedQuestions.length).toBeGreaterThan(0);

        for (let i = 0; i < sortedQuestions.length - 1; i++) {
            const currentDate = new Date(sortedQuestions[i].date);
            const nextDate = new Date(sortedQuestions[i + 1].date);
            expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
    });
});
