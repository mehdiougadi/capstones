import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL_HISTORY } from '@app/app.constants';
import { History } from '@app/interfaces/history';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    constructor(private readonly http: HttpClient) {}

    addHistory(history: unknown): Observable<unknown> {
        return this.http.post<History>(`${API_URL_HISTORY}/`, history).pipe(catchError(this.handleError));
    }

    getAllHistory(): Observable<History[]> {
        return this.http.get<History[]>(`${API_URL_HISTORY}/`).pipe(catchError(this.handleError));
    }

    deleteAllHistories(): Observable<unknown> {
        return this.http.delete<History>(`${API_URL_HISTORY}/`).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        return throwError(() => error.error);
    }
}
