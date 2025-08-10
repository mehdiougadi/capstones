import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PASSWORD_ERROR, Routes } from '@app/app.constants';
import { AuthService } from '@app/services/auth/auth.service';
import { catchError, tap } from 'rxjs';

@Component({
    selector: 'app-administration-login',
    templateUrl: './administration-login.component.html',
    styleUrls: ['./administration-login.component.scss'],
})
export class AdministrationLoginComponent {
    password: string;
    errorMessage: string;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {
        this.password = '';
        this.errorMessage = '';
    }

    onSubmit() {
        this.authService
            .authenticate(this.password)
            .pipe(
                tap((isValid: boolean) => {
                    if (isValid) {
                        this.authService.setAuthenticated();
                        this.router.navigate([Routes.Administration]);
                    } else {
                        this.errorMessage = PASSWORD_ERROR;
                        this.password = '';
                    }
                }),
                catchError(() => {
                    return [];
                }),
            )
            .subscribe();
    }
}
