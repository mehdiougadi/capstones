import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameHistory } from '@common/interfaces/game-history';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameHistoryManager {
    private readonly historyURL: string = environment.serverUrl + '/history';
    constructor(private readonly http: HttpClient) {}

    getHistory(): Observable<GameHistory[]> {
        return this.http.get<GameHistory[]>(`${this.historyURL}`);
    }
    deleteHistory(): Observable<boolean> {
        return this.http.delete<boolean>(`${this.historyURL}/`);
    }
}
