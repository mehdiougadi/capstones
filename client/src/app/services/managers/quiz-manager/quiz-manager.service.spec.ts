import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QuizMessage } from '@common/client-message/quiz-pop-up';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { Quiz } from '@common/interfaces/quiz';
import { environment } from 'src/environments/environment';
import { QuizManagerService } from './quiz-manager.service';

describe('QuizManagerService', () => {
    let service: QuizManagerService;
    let httpTestingController: HttpTestingController;
    let mockQuizList: Quiz[];
    let mockQuestionList: Question[];
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatDialog', ['open']);
        mockQuestionList = [
            { _id: 'testID', text: 'Test question', choices: [], type: QuestionType.QCM, points: 10, date: new Date() },
            { _id: 'secondTestID', text: 'Test Quiz number 2', choices: [], type: QuestionType.QCM, points: 50, date: new Date() },
        ];
        mockQuizList = [
            {
                _id: 'testQuizID',
                title: 'Test Quiz',
                description: 'Quiz description',
                questions: mockQuestionList,
                duration: 30,
                visible: false,
                lastModification: new Date(),
            },
            {
                _id: 'testQuizsecondID',
                title: 'Test Quiz second',
                description: 'Quiz description second',
                questions: mockQuestionList,
                duration: 30,
                visible: true,
                lastModification: new Date(),
            },
        ];
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [QuizManagerService, { provide: MatDialog, useValue: spy }],
        });
        service = TestBed.inject(QuizManagerService);
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        httpTestingController = TestBed.inject(HttpTestingController);
        const quizUrl = `${environment.serverUrl}/quiz`;
        const quizReq = httpTestingController.expectOne(quizUrl);
        quizReq.flush(mockQuizList);
        service.currentQuiz = mockQuizList[0];
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('updateQuizList', () => {
        it('should update the quiz list', () => {
            const url = `${environment.serverUrl}/quiz`;

            service.updateQuizList();

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('GET');
            expect(req.request.body).toBeNull();

            req.flush(mockQuizList);
            expect(service.quizList.length).toEqual(2);
            expect(service.visibleQuiz.length).toEqual(1);
        });
    });

    describe('addQuizToDB', () => {
        it('should add valid quiz to DB', () => {
            const url = `${environment.serverUrl}/quiz`;
            spyOn(service, 'updateQuizList');
            spyOn(service, 'clearCurrentQuiz');
            spyOn(service, 'verifyQuiz').and.returnValue(true);
            spyOn(service['idGeneratorService'], 'generateId').and.returnValue('testQuizID');

            service.addQuizToDB();

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('POST');

            req.flush(true);

            expect(service.updateQuizList).toHaveBeenCalled();
            expect(service.clearCurrentQuiz).toHaveBeenCalled();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuizMessage.CREATE_QUIZ_SUCCESS },
            });
        });

        it('should not add invalid quiz to DB', () => {
            const url = `${environment.serverUrl}/quiz`;
            spyOn(service, 'updateQuizList');
            spyOn(service, 'clearCurrentQuiz');
            spyOn(service, 'verifyQuiz').and.returnValue(false);
            spyOn(service['idGeneratorService'], 'generateId').and.returnValue('testQuizID');

            service.addQuizToDB();

            httpTestingController.expectNone(url);

            expect(service.updateQuizList).not.toHaveBeenCalled();
            expect(service.clearCurrentQuiz).not.toHaveBeenCalled();
            expect(service['idGeneratorService'].generateId).not.toHaveBeenCalled();
            expect(dialogSpy.open).not.toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuizMessage.CREATE_QUIZ_SUCCESS },
            });
        });
    });

    describe('modifyQuizFromDB', () => {
        it('should modify a valid quiz', () => {
            const url = `${environment.serverUrl}/quiz/${mockQuizList[0]._id}`;
            spyOn(service, 'updateQuizList');
            spyOn(service, 'verifyQuiz').and.returnValue(true);

            service.modifyQuizFromDB(mockQuizList[0]);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('PUT');
            expect(req.request.body).toBeDefined();

            req.flush(true);

            expect(service.updateQuizList).toHaveBeenCalled();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuizMessage.MODIFY_QUIZ_SUCCESS },
            });

            expect(req.request.body.lastModification.getTime()).toEqual(req.request.body.lastModification.getTime());
        });

        it('should not modify an invalid quiz', () => {
            const url = `${environment.serverUrl}/quiz/${mockQuizList[0]._id}`;
            spyOn(service, 'updateQuizList');
            spyOn(service, 'verifyQuiz').and.returnValue(false);

            service.modifyQuizFromDB(mockQuizList[0]);

            httpTestingController.expectNone(url);

            expect(service.updateQuizList).not.toHaveBeenCalled();
            expect(dialogSpy.open).not.toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuizMessage.MODIFY_QUIZ_SUCCESS },
            });
        });
    });

    describe('deleteQuizFromDB', () => {
        it('should delete a quiz', () => {
            const url = `${environment.serverUrl}/quiz/${mockQuizList[0]._id}`;
            spyOn(service, 'updateQuizList');

            service.deleteQuizFromDB(mockQuizList[0]);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('DELETE');

            req.flush(true);

            expect(service.updateQuizList).toHaveBeenCalled();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuizMessage.DELETE_QUIZ_SUCCESS },
            });
        });

        it('should not modify an invalid quiz', () => {
            const url = `${environment.serverUrl}/quiz/${mockQuizList[0]._id}`;
            spyOn(service, 'updateQuizList');

            service.deleteQuizFromDB(mockQuizList[0]);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('DELETE');

            req.flush('Mock error', { status: 404, statusText: 'Not Found' });

            expect(service.updateQuizList).toHaveBeenCalled();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuizMessage.DELETE_QUIZ_FAIL },
            });
        });
    });

    describe('addQuestionToQuiz', () => {
        it('should add a question to the current quiz', () => {
            spyOn(service['idGeneratorService'], 'generateId').and.returnValue('testID');
            service.currentQuiz = mockQuizList[0];

            service.addQuestionToQuiz(mockQuestionList[0]);

            expect(service.currentQuiz.questions[2]).toEqual(mockQuestionList[0]);
        });
    });

    describe('saveQuizToDB', () => {
        it('should save new quiz if current quiz does not have an ID', () => {
            const spy = spyOn(service, 'addQuizToDB');
            service.currentQuiz = { _id: '' } as Quiz;
            service.saveQuizToDB();
            expect(spy).toHaveBeenCalled();
        });
        it('should call addQuizToDB when currentQuiz has no ID', () => {
            const spy = spyOn(service, 'addQuizToDB');
            service.currentQuiz = { _id: '' } as Quiz;
            service.saveQuizToDB();
            expect(spy).toHaveBeenCalled();
        });
        it('should call modifyQuizFromDB when currentQuiz exists in quizList', () => {
            const spy = spyOn(service, 'modifyQuizFromDB');
            const spyUpdate = spyOn(service, 'updateQuizList');
            const mockQuiz = { _id: '1', title: 'Existing Quiz' } as Quiz;
            service.currentQuiz = mockQuiz;
            service.quizList = [mockQuiz];

            service.saveQuizToDB();

            expect(spy).toHaveBeenCalledWith(mockQuiz);
            expect(spyUpdate).toHaveBeenCalled();
        });
        it('should call addQuizToDB when currentQuiz has an ID but is not found in quizList', () => {
            const spy = spyOn(service, 'addQuizToDB');
            const spyUpdate = spyOn(service, 'updateQuizList');
            service.currentQuiz = { _id: '2', title: 'New Quiz' } as Quiz;
            service.quizList = [{ _id: '1', title: 'Existing Quiz' } as Quiz];

            service.saveQuizToDB();

            expect(spy).toHaveBeenCalled();
            expect(spyUpdate).toHaveBeenCalled();
        });
    });

    describe('modifyQuestionFromQuiz', () => {
        it('should modify a question of the current quiz', () => {
            service.currentQuiz = mockQuizList[0];
            mockQuestionList[0].text = 'newText';

            service.modifyQuestionFromQuiz(mockQuestionList[0]);

            expect(service.currentQuiz.questions[0].text).toEqual(mockQuestionList[0].text);
        });
    });

    describe('deleteQuestionFromQuiz', () => {
        it('should delete a question of the current quiz', () => {
            service.currentQuiz = mockQuizList[0];
            service.deleteQuestionFromQuiz(mockQuestionList[0]);

            expect(service.currentQuiz.questions[0]).toBe(mockQuestionList[1]);
        });
    });

    describe('clearCurrentQuiz', () => {
        it('should clear the current quiz', () => {
            service.currentQuiz = mockQuizList[0];
            service.clearCurrentQuiz();

            expect(service.currentQuiz).not.toEqual(mockQuizList[0]);
        });
    });

    describe('verifyQuiz', () => {
        it('should return true if the quiz is verified', () => {
            spyOn(service['quizValidationService'], 'isQuizValid').and.returnValue(true);
            spyOn(service['quizValidationService'], 'isDuplicateTitle').and.returnValue(true);
            const result = service.verifyQuiz();
            expect(result).toEqual(true);
        });
    });

    describe('verifyQuiz', () => {
        it('should return false if the quiz is not verified', () => {
            spyOn(service['quizValidationService'], 'isQuizValid').and.returnValue(true);
            spyOn(service['quizValidationService'], 'isDuplicateTitle').and.returnValue(false);
            const result = service.verifyQuiz();
            expect(result).toEqual(false);
        });
    });
    describe('setCurrentQuiz', () => {
        it('should reset CurrentQuiz', () => {
            const spy = spyOn(service, 'updateQuizList');
            const result = service.setCurrentQuiz(mockQuizList[0]);
            expect(result).toBeTrue();
            expect(service.currentQuiz).not.toEqual(mockQuizList[0]);
            expect(spy).toHaveBeenCalled();
        });
        it('should set CurrentQuiz', () => {
            const spy = spyOn(service, 'updateQuizList');
            const testQuiz = { _id: 'testing' } as Quiz;
            const result = service.setCurrentQuiz(testQuiz);
            expect(service.currentQuiz).toEqual(testQuiz);
            expect(result).toBeFalse();
            expect(spy).toHaveBeenCalled();
        });
    });
});
