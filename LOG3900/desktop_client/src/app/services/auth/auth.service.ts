import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL_AUTH } from '@app/app.constants';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private isAuthenticated: boolean;

    constructor(private readonly http: HttpClient) {
        this.isAuthenticated = false;
    }

    authenticate(password: string): Observable<boolean> {
        const data = { password };
        return this.http.post<boolean>(API_URL_AUTH, data);
    }

    isAuthenticatedUser(): boolean {
        return this.isAuthenticated;
    }

    setAuthenticated() {
        this.isAuthenticated = true;
    }

    clearAuthentication() {
        this.isAuthenticated = false;
    }
}
