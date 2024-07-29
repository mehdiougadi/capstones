import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QuestionMessage } from '@common/client-message/question-pop-up';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { environment } from 'src/environments/environment';
import { QuestionManagerService } from './question-manager.service';

describe('QuestionManagerService', () => {
    let service: QuestionManagerService;
    let httpTestingController: HttpTestingController;
    let mockQuestionList: Question[];
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatDialog', ['open']);
        mockQuestionList = [
            { _id: 'testID', text: 'Test Quiz', choices: [], type: QuestionType.QCM, points: 10, date: new Date() },
            { _id: 'secondTestID', text: 'Test Quiz number 2', choices: [], type: QuestionType.QCM, points: 50, date: new Date() },
        ];
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [QuestionManagerService, { provide: MatDialog, useValue: spy }],
        });
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        service = TestBed.inject(QuestionManagerService);
        httpTestingController = TestBed.inject(HttpTestingController);
        const url = `${environment.serverUrl}/question`;
        const req = httpTestingController.expectOne(url);
        req.flush(true);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('updateQuestionsList', () => {
        it('should be created', () => {
            const url = `${environment.serverUrl}/question`;

            service.updateQuestionsList();

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('GET');
            expect(req.request.body).toBeNull();

            req.flush(true);
        });
    });

    describe('addQuestionToDB', () => {
        it('should add a question to the DB', () => {
            const requestBody = {
                ...mockQuestionList[0],
                date: mockQuestionList[0].date.toISOString(),
            };
            spyOn(service, 'verifyQuestion').and.returnValue(true);
            spyOn(service['idGeneratorService'], 'generateId').and.returnValue('testID');

            const url = `${environment.serverUrl}/question`;

            const result = service.addQuestionToDB(mockQuestionList[0]);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toEqual(requestBody);

            req.flush(true);

            expect(result).toEqual(true);
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuestionMessage.CREATE_QUESTION_SUCCESS },
            });
        });

        it('should not add an invalid question to the DB', () => {
            spyOn(service, 'verifyQuestion').and.returnValue(false);
            spyOn(service['idGeneratorService'], 'generateId').and.returnValue('testID');

            const url = `${environment.serverUrl}/question`;

            const result = service.addQuestionToDB(mockQuestionList[0]);

            httpTestingController.expectNone(url);

            expect(result).toEqual(false);
            expect(dialogSpy.open).not.toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuestionMessage.CREATE_QUESTION_SUCCESS },
            });
        });
    });

    describe('deleteQuestionFromDB', () => {
        it('should delete a question from the DB', () => {
            const url = `${environment.serverUrl}/question/${mockQuestionList[0]._id}`;
            spyOn(service, 'updateQuestionsList');

            service.deleteQuestionFromDB(mockQuestionList[0]._id);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('DELETE');
            req.flush(true);

            expect(service.updateQuestionsList).toHaveBeenCalledWith();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuestionMessage.DELETE_QUESTION_SUCCESS },
            });
        });

        it('should pop error message when there is an error in deletion', () => {
            const url = `${environment.serverUrl}/question/${mockQuestionList[0]._id}`;
            spyOn(service, 'updateQuestionsList');

            service.deleteQuestionFromDB(mockQuestionList[0]._id);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('DELETE');
            req.flush('Mock error', { status: 404, statusText: 'Not Found' });

            expect(service.updateQuestionsList).not.toHaveBeenCalledWith();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuestionMessage.DELETE_QUESTION_FAIL },
            });
        });
    });

    describe('modifyQuestionFromDB', () => {
        it('should modify a valid question', () => {
            const url = `${environment.serverUrl}/question/${mockQuestionList[0]._id}`;
            spyOn(service, 'verifyQuestion').and.returnValue(true);
            spyOn(service, 'updateQuestionsList');

            const result = service.modifyQuestionFromDB(mockQuestionList[0]);

            const req = httpTestingController.expectOne(url);
            expect(req.request.method).toEqual('PUT');
            req.flush(true);

            expect(result).toEqual(true);
            expect(service.updateQuestionsList).toHaveBeenCalled();
            expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuestionMessage.MODIFY_QUESTION_SUCCESS },
            });
        });

        it('should not modify an invalid question', () => {
            const url = `${environment.serverUrl}/question/${mockQuestionList[0]._id}`;
            spyOn(service, 'verifyQuestion').and.returnValue(false);
            spyOn(service, 'updateQuestionsList');

            const result = service.modifyQuestionFromDB(mockQuestionList[0]);

            httpTestingController.expectNone(url);

            expect(result).toEqual(false);
            expect(service.updateQuestionsList).not.toHaveBeenCalledWith();
            expect(dialogSpy.open).not.toHaveBeenCalledWith(jasmine.anything(), {
                data: { message: QuestionMessage.MODIFY_QUESTION_SUCCESS },
            });
        });
    });

    describe('deepCopyQuestion', () => {
        it('should make a copy of a question', () => {
            const result = service.deepCopyQuestion(mockQuestionList[0]);
            expect(result).toEqual(JSON.parse(JSON.stringify(mockQuestionList[0])));
        });
    });

    describe('verifyQuestion', () => {
        it('should return true if question is verified', () => {
            spyOn(service['questionValidationService'], 'isTitleInBank').and.returnValue(true);
            spyOn(service['questionValidationService'], 'isQuestionValid').and.returnValue(true);
            const result = service.verifyQuestion(mockQuestionList[0]);
            expect(result).toEqual(true);
        });
    });

    describe('verifyQuestion', () => {
        it('should return false if question is not verified', () => {
            spyOn(service['questionValidationService'], 'isTitleInBank').and.returnValue(true);
            spyOn(service['questionValidationService'], 'isQuestionValid').and.returnValue(false);
            const result = service.verifyQuestion(mockQuestionList[0]);
            expect(result).toEqual(false);
        });
    });
});
