import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AddPlayerResponse } from '@app/common-client/interfaces/add-player';
import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { GameState } from '@common/enum/socket-messages';
import { Answer } from '@common/interfaces/answer';
import { Quiz } from '@common/interfaces/quiz';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameManager } from './game-manager.service';

describe('CommunicationService', () => {
    let service: GameManager;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameManager],
        });
        service = TestBed.inject(GameManager);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getQuizById', () => {
        it('should retrieve a quiz by id', () => {
            const quizId = '1';
            const mockQuiz: Quiz = {
                _id: '1',
                title: 'Quiz 1',
                description: 'Mock description',
                questions: [],
                duration: 60,
                visible: true,
                lastModification: new Date(),
            };

            service.getQuizById(quizId).subscribe((quiz) => {
                expect(quiz).toEqual(mockQuiz);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/quiz/${quizId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockQuiz);
        });
    });

    describe('createSession', () => {
        it('should create a session and return the room id', () => {
            const quizId = '1';
            const mockRoomId = '123';

            service.createSession(quizId, true, false).subscribe((roomId) => {
                expect(roomId).toEqual(mockRoomId);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/create/${quizId}`);
            expect(req.request.method).toBe('POST');
            req.flush(mockRoomId);
        });
    });

    describe('getGameInfo', () => {
        it('should retrieve game info', () => {
            const roomId = '123';
            const mockRoom: Room = {
                id: roomId,
                quiz: {
                    _id: '1',
                    title: 'Quiz 1',
                    description: 'Mock description',
                    visible: true,
                    questions: [],
                    duration: 60,
                    lastModification: new Date(),
                },
                listPlayers: [],
                currentTime: 0,
                accessCode: 'ABC1',
                roundFinished: false,
                isLocked: false,
                isTesting: false,
                isPaused: false,
                currentQuestionIndex: 0,
                questionStats: [],
                currentState: GameState.END_ROUND,
            };

            service.getGameInfo(roomId).subscribe((room) => {
                expect(room).toEqual(mockRoom);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/room/${roomId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockRoom);
        });
    });

    describe('getGamePlayers', () => {
        it('should retrieve game players', () => {
            const roomId = '123';
            const mockPlayers: Player[] = [new Player('Player 1'), new Player('Player 2')];

            service.getGamePlayers(roomId).subscribe((players) => {
                expect(players).toEqual(mockPlayers);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/room/${roomId}/players`);
            expect(req.request.method).toBe('GET');
            req.flush(mockPlayers);
        });
    });

    describe('verifAnswers', () => {
        it('should verify answers and return a boolean', () => {
            const roomId = '123';
            const currentPlayer = 'JohnDoe';
            const answers: Answer[] = [{ text: 'Answer 1', isCorrect: true }];
            const expectedResult = true;

            service.verifAnswers(roomId, currentPlayer, answers).subscribe((result) => {
                expect(result).toBe(expectedResult);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/room/${roomId}/verif`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ currentPlayer, answers });
            req.flush(expectedResult);
        });
    });

    describe('setQrlAnswer', () => {
        it('should set QRL answer and return a boolean', () => {
            const roomId = '123';
            const currentPlayer = 'JohnDoe';
            const qrlAnswer = 'QRL123';
            const expectedResult = true;

            service.setQrlAnswer(roomId, currentPlayer, qrlAnswer).subscribe((result) => {
                expect(result).toBe(expectedResult);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/room/${roomId}/qrl`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ currentPlayer, qrlAnswer });
            req.flush(expectedResult);
        });
    });

    describe('nextRound', () => {
        it('should start the next round and return a boolean', () => {
            const roomId = '123';
            const expectedResult = true;

            service.nextRound(roomId).subscribe((result) => {
                expect(result).toBe(expectedResult);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/start/${roomId}`);
            expect(req.request.method).toBe('POST');
            req.flush(expectedResult);
        });
    });

    describe('addPlayer', () => {
        it('should add a player to the room and return a boolean', () => {
            const roomId = '123';
            const currentPlayer = 'JohnDoe';
            const expectedResult = true;

            service.addPlayer(roomId, currentPlayer).subscribe((result) => {
                expect(result).toBe(expectedResult);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/addPlayer/${roomId}`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ player: currentPlayer });
            req.flush(expectedResult);
        });
    });

    describe('deleteRoom', () => {
        it('should delete a room and return a boolean', () => {
            const roomId = '123';
            const expectedResult = true;

            service.deleteRoom(roomId).subscribe((result) => {
                expect(result).toBe(expectedResult);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/room/delete/${roomId}`);
            expect(req.request.method).toBe('POST');
            req.flush(expectedResult);
        });
    });
    it('should return a function that returns an Observable of the provided result when invoked', () => {
        const mockResult = 'Mock Result';
        const errorHandler = service.handleError('testRequest', mockResult);

        const error = new Error('Test Error');
        const resultObservable = errorHandler(error);

        expect(resultObservable).toBeInstanceOf(Observable);

        resultObservable.subscribe({
            next: (value) => {
                expect(value).toEqual(mockResult);
            },
            error: () => {
                fail('Error handler should not produce an error.');
            },
        });
    });
    it('should join a room and return the response', (done) => {
        const mockResponse: AddPlayerResponse = { id: '1', msg: 'Player added successfully' };
        const username = 'JohnDoe';
        const accessCode = 'ABC123';
        const isRandomMode = false;

        service.joinRoom(username, accessCode, isRandomMode).subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        const req = httpMock.expectOne(
            `${environment.serverUrl}/room/addPlayer?username=${username}&accessCode=${accessCode}&isRandomMode=${isRandomMode}`,
        );
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('should leave a room and return a boolean', (done) => {
        const mockResponse = true;
        const username = 'JohnDoe';
        const roomId = '123';

        service.leaveRoom(username, roomId).subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/room/removePlayer?username=${username}&roomId=${roomId}`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('should end a game and return a boolean', (done) => {
        const mockResponse = true;
        const roomId = '123';

        service.endGame(roomId).subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/room/${roomId}/endGame`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });
    it('should stop the timer in a room and return a boolean', (done) => {
        const mockResponse = true;
        const roomId = '123';

        service.stopTimer(roomId).subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/room/${roomId}/stopTimer`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('should start the timer in a room and return a boolean', (done) => {
        const mockResponse = true;
        const roomId = '123';

        service.startTimer(roomId).subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/room/${roomId}/restartTimer`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('should enable panic mode ', (done) => {
        const mockResponse = true;
        const roomId = '123';

        service.enablePanicMode(roomId).subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/room/${roomId}/panicMode`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({});
        req.flush(mockResponse);
    });
});
