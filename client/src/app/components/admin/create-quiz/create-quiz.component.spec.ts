import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { QuestionDisplayModalComponent } from '@app/components/admin/question-display-modal/question-display-modal.component';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { CreateQuizComponent } from './create-quiz.component';

describe('CreateQuizComponent', () => {
    let component: CreateQuizComponent;
    let fixture: ComponentFixture<CreateQuizComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQuizComponent],
            imports: [MatDialogModule, BrowserAnimationsModule, HttpClientTestingModule, DragDropModule, FormsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                QuizManagerService,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateQuizComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open QuestionDisplayModalComponent when createQuestionInQuiz is called', () => {
        const dialogSpy = spyOn(component['dialog'], 'open').and.callThrough();

        component.createQuestionInQuiz();

        expect(dialogSpy).toHaveBeenCalledWith(QuestionDisplayModalComponent, {
            data: {
                question: { _id: '', title: '', type: '', points: 0, choices: [], date: jasmine.any(Date) },
                questionState: jasmine.any(Number),
                questionContext: jasmine.any(Number),
            },
        });
    });

    it('should open QuestionDisplayModalComponent when openQuestionInQuiz is called', () => {
        const mockQuestion = { _id: '1', text: 'Question 1', type: QuestionType.QCM, points: 10, choices: [], date: new Date() };
        const dialogSpy = spyOn(component['dialog'], 'open');
        component.openQuestionInQuiz(mockQuestion);

        expect(dialogSpy).toHaveBeenCalledWith(QuestionDisplayModalComponent, {
            data: {
                question: mockQuestion,
                questionState: jasmine.any(Number),
                questionContext: jasmine.any(Number),
            },
        });
    });

    it('should add question to quiz when onQuizQuestionDrop is called', () => {
        const mockQuestion = { _id: '1', text: 'Question 1', type: QuestionType.QCM, points: 10, choices: [], date: new Date() };
        const addQuestionSpy = spyOn(component['quizManagerService'], 'addQuestionToQuiz');
        const deepCopySpy = spyOn(component['bankQuestionService'], 'deepCopyQuestion');
        component.onQuizQuestionDrop({ item: { data: mockQuestion } } as CdkDragDrop<Question[]>);
        expect(deepCopySpy).toHaveBeenCalledWith(mockQuestion);
        expect(addQuestionSpy).toHaveBeenCalledWith(component['bankQuestionService'].deepCopyQuestion(mockQuestion));
    });

    it('should order question in list when orderQuestionInList is called', () => {
        const mockQuestion1 = { _id: '1', text: 'Question 1', type: QuestionType.QCM, points: 10, choices: [], date: new Date() };
        const mockQuestion2 = { _id: '2', text: 'Question 2', type: QuestionType.QCM, points: 10, choices: [], date: new Date() };
        component['quizManagerService'].currentQuiz.questions = [mockQuestion1, mockQuestion2];

        const event: CdkDragDrop<Question[]> = {
            previousIndex: 0,
            currentIndex: 1,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item: { data: mockQuestion1 } as any,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            container: null!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            previousContainer: null!,
            isPointerOverContainer: false,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: {} as MouseEvent,
        };
        component.orderQuestionInList(event);

        expect(component['quizManagerService'].currentQuiz.questions[0]).toEqual(mockQuestion2);
        expect(component['quizManagerService'].currentQuiz.questions[1]).toEqual(mockQuestion1);
    });
});
