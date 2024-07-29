import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmModalComponent } from '@app/components/admin/confirm-modal/confirm-modal.component';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { Quiz } from '@common/interfaces/quiz';
import { ListQuizComponent } from './list-quiz.component';

describe('ListQuizComponent', () => {
    let component: ListQuizComponent;
    let fixture: ComponentFixture<ListQuizComponent>;
    let mockQuizManagerService: jasmine.SpyObj<QuizManagerService>;
    let mockDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', [
            'deleteQuizFromDB',
            'modifyQuizFromDB',
            'clearCurrentQuiz',
            'updateQuizList',
            'setCurrentQuiz',
        ]);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            declarations: [ListQuizComponent],
            imports: [HttpClientModule, MatDialogModule],
            providers: [
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                { provide: MatDialog, useValue: mockDialog },
            ],
        });
        fixture = TestBed.createComponent(ListQuizComponent);
        component = fixture.componentInstance;
        mockQuizManagerService.currentQuiz = {
            _id: 'test2',
            title: 'TEST',
            description: 'test description',
            questions: [],
            duration: 60,
            visible: true,
            lastModification: new Date(),
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set currentQuiz and selectedQuiz quiz', () => {
        const newQuiz: Quiz = {
            _id: 'test',
            title: 'TEST',
            description: 'test description',
            questions: [],
            duration: 60,
            visible: true,
            lastModification: new Date(),
        };
        spyOn(component.currentQuizUpdated, 'emit');

        component.setCurrentQuiz(newQuiz);

        expect(component.currentQuizUpdated.emit).toHaveBeenCalled();
    });

    it('should delete quiz from DB', () => {
        const newQuiz: Quiz = {
            _id: 'test',
            title: 'TEST',
            description: 'test description',
            questions: [],
            duration: 60,
            visible: true,
            lastModification: new Date(),
        };
        component.deleteQuiz(new MouseEvent('click'), newQuiz);

        expect(mockDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { quizToDelete: newQuiz } });
    });

    it('should toggle visibility of quiz and modify quiz in DB', () => {
        const newQuiz: Quiz = {
            _id: 'test',
            title: 'TEST',
            description: 'test description',
            questions: [],
            duration: 60,
            visible: true,
            lastModification: new Date(),
        };
        component.toggleVisibilityQuiz(new MouseEvent('click'), newQuiz);

        expect(newQuiz.visible).toBe(false);
        expect(mockQuizManagerService.modifyQuizFromDB).toHaveBeenCalledWith(newQuiz);
    });
});
