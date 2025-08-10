import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AddPlayerResponse } from '@app/common-client/interfaces/add-player';
import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { Answer } from '@common/interfaces/answer';
import { Quiz } from '@common/interfaces/quiz';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameManager {
    private readonly baseUrl: string = environment.serverUrl;
    private readonly roomURL: string = environment.serverUrl + '/room';
    constructor(private readonly http: HttpClient) {}

    getQuizById(id: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/quiz/${id}`).pipe(catchError(this.handleError<Quiz>('quiz')));
    }
    createSession(quizId: string, isTesting: boolean, randomMode: boolean): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/room/create/${quizId}`, {
            isTesting,
            randomMode,
        });
    }
    getGameInfo(id: string): Observable<Room> {
        return this.http.get<Room>(`${this.baseUrl}/room/room/${id}`).pipe(catchError(this.handleError<Room>('room')));
    }
    getGamePlayers(id: string): Observable<Player[]> {
        return this.http.get<Player[]>(`${this.baseUrl}/room/room/${id}/players`).pipe(catchError(this.handleError<Player[]>('players')));
    }

    verifAnswers(roomId: string, currentPlayer: string, answers: Answer[]): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/room/room/${roomId}/verif`, {
            currentPlayer,
            answers,
        });
    }

    setQrlAnswer(roomId: string, currentPlayer: string, qrlAnswer: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/room/room/${roomId}/qrl`, {
            currentPlayer,
            qrlAnswer,
        });
    }

    nextRound(roomId: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/room/start/${roomId}`, {});
    }
    addPlayer(roomId: string, currentPlayer: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/room/addPlayer/${roomId}`, {
            player: currentPlayer,
        });
    }
    joinRoom(username: string, accessCode: string, isRandomMode: boolean): Observable<AddPlayerResponse> {
        const params = new HttpParams().set('username', username).set('accessCode', accessCode).set('isRandomMode', isRandomMode);
        return this.http.post<AddPlayerResponse>(`${this.roomURL}/addPlayer`, {}, { params });
    }
    deleteRoom(roomId: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/room/delete/${roomId}`, {});
    }
    leaveRoom(username: string, roomId: string): Observable<boolean> {
        const params = new HttpParams().set('username', username).set('roomId', roomId);
        return this.http.post<boolean>(`${this.roomURL}/removePlayer`, {}, { params });
    }
    endGame(roomId: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.roomURL}/${roomId}/endGame`, {});
    }
    handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
    stopTimer(roomId: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.roomURL}/${roomId}/stopTimer`, {});
    }
    startTimer(roomId: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.roomURL}/${roomId}/restartTimer`, {});
    }
    enablePanicMode(roomId: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.roomURL}/${roomId}/panicMode`, {});
    }
}
