import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL_GAME } from '@app/app.constants';
import { Game } from '@app/interfaces/game';
import { Question } from '@app/interfaces/question';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    constructor(private readonly http: HttpClient) {}

    getAllGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${API_URL_GAME}/`).pipe(catchError(this.handleError));
    }

    getGame(id: string): Observable<Game> {
        return this.http.get<Game>(`${API_URL_GAME}/${id}`).pipe(catchError(this.handleError));
    }

    getAllGamesAdmin(): Observable<Game[]> {
        return this.http.get<Game[]>(`${API_URL_GAME}/admin`).pipe(catchError(this.handleError));
    }

    getGameAdmin(id: string): Observable<Game> {
        return this.http.get<Game>(`${API_URL_GAME}/admin/${id}`).pipe(catchError(this.handleError));
    }

    getQuestions(id: string): Observable<Question[]> {
        return this.http.get<Question[]>(`${API_URL_GAME}/game/${id}/question/admin`).pipe(catchError(this.handleError));
    }

    createGame(createGameDto: unknown): Observable<unknown> {
        return this.http.post(`${API_URL_GAME}/`, createGameDto).pipe(catchError(this.handleError));
    }

    updateGame(id: string, updateGameDto: unknown): Observable<unknown> {
        return this.http.patch(`${API_URL_GAME}/${id}`, updateGameDto).pipe(catchError(this.handleError));
    }

    deleteGame(id: string): Observable<unknown> {
        return this.http.delete(`${API_URL_GAME}/${id}`).pipe(catchError(this.handleError));
    }

    createQuestion(gameId: string, createQuestionDto: unknown): Observable<unknown> {
        return this.http.post(`${API_URL_GAME}/${gameId}/question/`, createQuestionDto).pipe(catchError(this.handleError));
    }

    updateQuestion(gameId: string, questionId: string, updateQuestionDto: unknown): Observable<unknown> {
        return this.http.patch(`${API_URL_GAME}/${gameId}/question/${questionId}`, updateQuestionDto).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        return throwError(() => error.error);
    }
}
