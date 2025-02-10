import { ErrorType } from '@app/app.constants';
import { QuestionController } from '@app/controllers/question/question.controller';
import { Question } from '@app/model/database/question';
import { QuestionService } from '@app/services/question/question.service';
import { HttpStatus } from '@nestjs/common/enums';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

describe.only('QuestionController', () => {
    let controller: QuestionController;
    let questionService: SinonStubbedInstance<QuestionService>;

    beforeEach(async () => {
        questionService = createStubInstance(QuestionService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuestionController],
            providers: [
                {
                    provide: QuestionService,
                    useValue: questionService,
                },
            ],
        }).compile();
        controller = module.get<QuestionController>(QuestionController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAllQuestion() should return all question', async () => {
        const fakeQuestion = [new Question(), new Question()];
        questionService.getAllQuestion.resolves(fakeQuestion);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (question) => {
            expect(question).toEqual(fakeQuestion);
            return res;
        };

        await controller.findAllQuestion('', res);
    });

    it('findAllQuestion() should return NOT_FOUND when service is unable to fetch all question', async () => {
        questionService.getAllQuestion.rejects(new Error(ErrorType.NotFoundQuestion));

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findAllQuestion('', res);
    });

    it('findAllQuestionForAdmin() should return all question with the correct answers', async () => {
        const fakeQuestion = [new Question(), new Question()];
        questionService.getAllQuestion.resolves(fakeQuestion);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (question) => {
            expect(question).toEqual(fakeQuestion);
            return res;
        };

        await controller.findAllQuestionForAdmin('', res);
    });

    it('findAllQuestionForAdmin() should return NOT_FOUND when service is unable to fetch all question', async () => {
        questionService.getAllQuestion.rejects(new Error(ErrorType.NotFoundQuestion));

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findAllQuestionForAdmin('', res);
    });

    it('findQuestion() should return the question', async () => {
        const fakeQuestion = new Question();
        questionService.getQuestion.resolves(fakeQuestion);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (question) => {
            expect(question).toEqual(fakeQuestion);
            return res;
        };

        await controller.findQuestion('', 1, res);
    });

    it('findQuestion() should return NOT_FOUND when service is unable to fetch the question', async () => {
        questionService.getQuestion.rejects(new Error(ErrorType.NotFoundQuestion));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findQuestion('', 1, res);
    });

    it('findQuestionForAdmin() should return the question', async () => {
        const fakeQuestion = new Question();
        questionService.getQuestion.resolves(fakeQuestion);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (question) => {
            expect(question).toEqual(fakeQuestion);
            return res;
        };

        await controller.findQuestionForAdmin('', 1, res);
    });

    it('findQuestionForAdmin() should return NOT_FOUND when service unable to fetch the question', async () => {
        questionService.getQuestion.rejects(new Error(ErrorType.NotFoundQuestion));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findQuestionForAdmin('', 1, res);
    });

    it('createQuestion() should return CREATED when service creates a question', async () => {
        questionService.addQuestion.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.send = () => res;

        await controller.createQuestion('', new Question(), res);
    });

    it('createQuestion() should return NOT_FOUND when service is unable to create a question', async () => {
        questionService.addQuestion.rejects(new Error(ErrorType.NotFoundGame));

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.createQuestion('', new Question(), res);
    });

    it('modifyQuestion() should succeed if service is able to modify the question', async () => {
        questionService.modifyQuestion.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.modifyQuestion('', new Question(), 1, res);
    });

    it('modifyQuestion() should return NOT_FOUND when service cannot modify the question', async () => {
        questionService.modifyQuestion.rejects(new Error(ErrorType.NotFoundQuestion));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.modifyQuestion('', new Question(), 1, res);
    });

    it('deleteQuestion() should succeed if service is able to delete the question', async () => {
        questionService.deleteQuestion.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteQuestion('', 1, res);
    });

    it('deleteQuestion() should return NOT_FOUND when service cannot delete the question', async () => {
        questionService.deleteQuestion.rejects(new Error(ErrorType.NotFoundQuestions));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.deleteQuestion('', 1, res);
    });
});
