import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminAuthenticatorService {
    private readonly storageKey = 'admin-auth-state';
    private enteredPassword: string = '';
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {
        const storedState = sessionStorage.getItem(this.storageKey);
        if (storedState) {
            this.enteredPassword = JSON.parse(storedState).enteredPassword;
        }
    }

    setEnteredPassword(password: string): void {
        this.enteredPassword = password;
        sessionStorage.setItem(this.storageKey, JSON.stringify({ enteredPassword: password }));
    }

    passwordValidation(): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/admin`, { password: this.enteredPassword });
    }
}
