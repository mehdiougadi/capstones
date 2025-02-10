import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL_GAME, QuestionType } from '@app/app.constants';
import { Game } from '@app/interfaces/game';
import { Question } from '@app/interfaces/question';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let httpMock: HttpTestingController;

    const mockGame: Game = {
        id: '1',
        title: 'Game 1',
        duration: 30,
        description: 'HERE WE GO',
        lastModification: '2023-09-13',
        questions: [
            {
                type: QuestionType.QCM,
                text: 'What is 2 + 2?',
                points: 5,
                choices: [
                    {
                        text: '3',
                        isCorrect: false,
                    },
                    {
                        text: '4',
                        isCorrect: true,
                    },
                    {
                        text: '5',
                        isCorrect: false,
                    },
                    {
                        text: '6',
                        isCorrect: false,
                    },
                ],
            },
        ],
        isVisible: true,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameService],
        });
        service = TestBed.inject(GameService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should retrieve all games via GET', () => {
        const mockGames: Game[] = [mockGame];

        service.getAllGames().subscribe((games: Game[]) => {
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should retrieve a game by ID via GET', () => {
        const gameId = '1';

        service.getGame(gameId).subscribe((game: Game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/${gameId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should retrieve all games via GET', () => {
        const mockGames: Game[] = [mockGame];

        service.getAllGamesAdmin().subscribe((games: Game[]) => {
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/admin`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should retrieve a game by ID via GET', () => {
        const gameId = '1';

        service.getGameAdmin(gameId).subscribe((game: Game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/admin/${gameId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should create a game via POST', () => {
        const createGameDto = {};
        const mockResponse = {};

        service.createGame(createGameDto).subscribe((response: unknown) => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(createGameDto);
        req.flush(mockResponse);
    });

    it('should update a game via PATCH', () => {
        const gameId = '1';
        const updateGameDto = {};
        const mockResponse = {};

        service.updateGame(gameId, updateGameDto).subscribe((response: unknown) => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/${gameId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(updateGameDto);
        req.flush(mockResponse);
    });

    it('should delete a game via DELETE', () => {
        const gameId = '1';
        const mockResponse = {};

        service.deleteGame(gameId).subscribe((response: unknown) => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/${gameId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(mockResponse);
    });

    it('should create a game via POST', () => {
        const gameId = '1';
        const createQuestionDto = {};
        const mockResponse = {};

        service.createQuestion(gameId, createQuestionDto).subscribe((response: unknown) => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/${gameId}/question/`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(createQuestionDto);

        req.flush(mockResponse);
    });

    it('should update a game via PATCH', () => {
        const gameId = '1';
        const questionId = '1';
        const updateQuestionDto = {};
        const mockResponse = {};

        service.updateQuestion(gameId, questionId, updateQuestionDto).subscribe((response: unknown) => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/${gameId}/question/${questionId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(updateQuestionDto);

        req.flush(mockResponse);
    });

    it('should retrieve questions from the API via GET', () => {
        const dummyId = 'your_dummy_id';
        const dummyQuestions: Question[] = [];

        service.getQuestions(dummyId).subscribe((questions: Question[]) => {
            expect(questions).toEqual(dummyQuestions);
        });

        const req = httpMock.expectOne(`${API_URL_GAME}/game/${dummyId}/question/admin`);
        expect(req.request.method).toBe('GET');
        req.flush(dummyQuestions);
    });

    it('should handle HTTP errors and return an error observable', () => {
        const mockErrorResponse = { status: 404, statusText: 'Not Found', error: 'Not Found Error' };
        const errorResponse = new HttpErrorResponse(mockErrorResponse);
        // Il faut mettre any pour pouvoir accéder au attributs privé de la classe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).handleError(errorResponse).subscribe(
            () => {
                fail('Expected error callback, but got success callback');
            },
            (error: string) => {
                expect(error).toEqual(mockErrorResponse.error);
            },
        );
    });
});
