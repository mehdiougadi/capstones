import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
    let component: ConfirmModalComponent;
    let fixture: ComponentFixture<ConfirmModalComponent>;
    let mockDialogRef: MatDialogRef<ConfirmModalComponent>;
    let mockQuizManagerService: jasmine.SpyObj<QuizManagerService>;
    const mockData = {
        quizToDelete: {
            _id: '1',
            title: 'Mock Quiz',
            description: 'Mock Description',
            questions: [],
            duration: 20,
            visible: true,
            lastModification: new Date(),
        },
    };

    beforeEach(() => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', ['deleteQuizFromDB']);
        TestBed.configureTestingModule({
            declarations: [ConfirmModalComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                { provide: MAT_DIALOG_DATA, useValue: mockData },
            ],
            imports: [MatDialogModule],
        });
        fixture = TestBed.createComponent(ConfirmModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog and delete quiz on deleteElement call', () => {
        component.deleteElement();
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(mockQuizManagerService.deleteQuizFromDB).toHaveBeenCalledWith(mockData.quizToDelete);
    });
});
