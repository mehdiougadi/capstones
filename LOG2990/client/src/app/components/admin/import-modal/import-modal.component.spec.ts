import { Injector, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { ImportQuizJsonService } from '@app/services/utils/Import/import-quiz-json.service';
import { Quiz } from '@common/interfaces/quiz';
import { ImportModalComponent } from './import-modal.component';

describe('ImportModalComponent', () => {
    let component: ImportModalComponent;
    let fixture: ComponentFixture<ImportModalComponent>;
    let mockDialogRef: MatDialogRef<ImportModalComponent>;
    let mockData: { quiz: Quiz };
    let mockImportQuizJsonService: Partial<ImportQuizJsonService>;
    let mockQuizManagerService: Partial<QuizManagerService>;

    beforeEach(() => {
        mockDialogRef = jasmine.createSpyObj(['close']);
        mockData = { quiz: {} as Quiz };
        mockImportQuizJsonService = {
            createQuiz: jasmine.createSpy('createQuiz').and.returnValue(true),
        };
        mockQuizManagerService = {
            addQuizToDB: jasmine.createSpy('addQuizToDB'),
            clearCurrentQuiz: jasmine.createSpy('clearCurrentQuiz'),
        };

        TestBed.configureTestingModule({
            declarations: [ImportModalComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockData },
                { provide: ImportQuizJsonService, useValue: mockImportQuizJsonService },
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                Injector,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(ImportModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send new title', () => {
        component.title = 'Test Title';
        component.sendNewTitle();
        expect(mockImportQuizJsonService.createQuiz).toHaveBeenCalledWith(mockData.quiz, 'Test Title');
        expect(mockQuizManagerService.addQuizToDB).toHaveBeenCalled();
        expect(mockQuizManagerService.clearCurrentQuiz).toHaveBeenCalled();
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
});
