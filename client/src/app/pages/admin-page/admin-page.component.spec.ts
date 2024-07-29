import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StateAdmin } from '@app/common-client/constant/state';
import { HeaderComponent } from '@app/components/general/header/header.component';
import { QuestionManagerService } from '@app/services/managers/question-manager/question-manager.service';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { ImportQuizJsonService } from '@app/services/utils/Import/import-quiz-json.service';
import { QuestionType } from '@common/constant/state';
import { ExportedQCM, ExportedQRL } from '@common/interfaces/question';
import { Quiz } from '@common/interfaces/quiz';
import { saveAs } from 'file-saver';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let mockMatDialog: jasmine.SpyObj<MatDialog>;
    let mockImportQuizJsonService: jasmine.SpyObj<ImportQuizJsonService>;
    let mockQuizManagerService: jasmine.SpyObj<QuizManagerService>;
    let mockQuestionManagerService: jasmine.SpyObj<QuestionManagerService>;
    let mockFileInput: Partial<HTMLInputElement>;
    let saveAsSpy: jasmine.Spy;

    beforeEach(() => {
        const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mockImportQuizJsonService = jasmine.createSpyObj('ImportQuizJsonService', ['isImportValid']);
        mockQuestionManagerService = jasmine.createSpyObj('QuestionManagerService', ['addQuestionToDB']);
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', [
            'addQuizToDB',
            'saveQuizToDB',
            'clearCurrentQuiz',
            'updateQuizList',
            'modifyQuizFromDB',
        ]);
        mockFileInput = { value: '', nativeElement: { value: '' } } as Partial<HTMLInputElement>;

        TestBed.configureTestingModule({
            declarations: [AdminPageComponent, HeaderComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: ImportQuizJsonService, useValue: mockImportQuizJsonService },
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                { provide: QuestionManagerService, useValue: mockQuestionManagerService },
                { provide: ElementRef, useValue: { nativeElement: mockFileInput } },
            ],
        });

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        component.fileInput = TestBed.inject(ElementRef) as ElementRef<HTMLInputElement>;
        mockMatDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        saveAsSpy = spyOn(saveAs, 'saveAs').and.stub();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should change state', () => {
        const newState: StateAdmin = StateAdmin.DEFAULT;
        component.changeState(newState);
        expect(component.currentStatePage).toEqual(newState);
        expect(component['quizManagerService'].clearCurrentQuiz).toHaveBeenCalled();
        expect(component.isExportButtonDisabled).toBeTrue();
        expect(component.isImportButtonDisabled).toBeTrue();
    });

    it('should set isImportButtonDisabled to true after state change', () => {
        const newState: StateAdmin = StateAdmin.DEFAULT;
        component.changeState(newState);
        expect(component.isImportButtonDisabled).toBeTrue();
    });

    it('should handle current quiz updated', () => {
        component.onCurrentQuizUpdated(true);
        expect(component.isExportButtonDisabled).toBeTrue();
        component.onCurrentQuizUpdated(false);
        expect(component.isExportButtonDisabled).toBeFalse();
    });

    it('should save new quiz', () => {
        component.saveQuiz();
        expect(component['quizManagerService'].saveQuizToDB).toHaveBeenCalled();
    });

    it('should export quiz JSON', () => {
        const mockQuiz: Quiz = {
            _id: '1',
            title: 'Test Quiz',
            description: 'Test Description',
            visible: true,
            questions: [],
            duration: 60,
            lastModification: new Date(),
        };
        component.exportQuizJson(mockQuiz);
        expect(saveAsSpy).toHaveBeenCalledOnceWith(new Blob([JSON.stringify(mockQuiz, null, 2)], { type: 'application/json' }));
    });

    it('should handle file selection', () => {
        const event = { target: { files: [new File([], 'test.json')] } } as unknown as Event;
        component.onFileSelected(event);
        expect(component.importedFile).toBeDefined();
        expect(component.isImportButtonDisabled).toBeFalse();
    });

    it('should import valid quiz', async () => {
        component.importedFile = new File([], 'test.json');
        mockImportQuizJsonService.isImportValid.and.returnValue(Promise.resolve(true));
        await component.importQuiz();
        expect(component['quizManagerService'].addQuizToDB).toHaveBeenCalled();
        expect(component['quizManagerService'].clearCurrentQuiz).toHaveBeenCalled();
        expect(component.fileInput.nativeElement.value).toBe('');
        expect(component.isImportButtonDisabled).toBeTrue();
    });

    it('should not import invalid quiz', async () => {
        component.importedFile = new File([], 'test.json');
        mockImportQuizJsonService.isImportValid.and.returnValue(Promise.resolve(false));
        await component.importQuiz();
        expect(component['quizManagerService'].addQuizToDB).not.toHaveBeenCalled();
        expect(component['quizManagerService'].clearCurrentQuiz).toHaveBeenCalled();
        expect(component.fileInput.nativeElement.value).toBe('');
        expect(component.isImportButtonDisabled).toBeTrue();
    });

    it('should show add question modal', () => {
        component.showModalAddQuestion();
        expect(mockMatDialog.open).toHaveBeenCalled();
    });

    it('should format QCM question for export', () => {
        const mockQuiz: Quiz = {
            _id: '1',
            title: 'Test Quiz',
            description: 'Test Description',
            visible: true,
            duration: 60,
            lastModification: new Date(),
            questions: [
                {
                    _id: '1',
                    text: 'What is the capital of France?',
                    points: 10,
                    type: QuestionType.QCM,
                    choices: [
                        { text: 'Paris', isCorrect: true },
                        { text: 'London', isCorrect: false },
                        { text: 'Berlin', isCorrect: false },
                    ],
                    date: new Date(),
                },
            ],
        };

        const exportedQuiz = component.formattingQuizExport(mockQuiz);
        const exportedQCM = exportedQuiz.questions[0] as ExportedQCM;

        expect(exportedQCM).toBeDefined();
        expect(exportedQCM.type).toBe(QuestionType.QCM);
    });

    it('should format QRL question for export', () => {
        const mockQuiz: Quiz = {
            _id: '1',
            title: 'Test Quiz',
            description: 'Test Description',
            visible: true,
            duration: 60,
            lastModification: new Date(),
            questions: [
                {
                    _id: '1',
                    text: 'What is the capital of France?',
                    points: 10,
                    type: QuestionType.QRL,
                    choices: [],
                    date: new Date(),
                },
            ],
        };

        const exportedQuiz = component.formattingQuizExport(mockQuiz);
        const exportedQRL = exportedQuiz.questions[0] as ExportedQRL;

        expect(exportedQRL).toBeDefined();
        expect(exportedQRL.type).toBe(QuestionType.QRL);
    });
});
