import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PasswordVerificationService {
    password: string = '';
    isConnected: boolean = false;
    private readonly baseUrl: string = environment.serverUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
    ) {}

    passwordValidation(password: string): void {
        this.password = password;
        this.http.post<boolean>(`${this.baseUrl}/admin`, { password }).subscribe((response) => {
            if (response) {
                this.router.navigate(['/admin']);
            }
        });
    }

    getStateConnected(): boolean {
        return this.isConnected;
    }
}
