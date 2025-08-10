import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Routes } from '@app/app.constants';
import { AuthService } from '@app/services/auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard {
    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {}

    canActivate(): boolean {
        const isAuth = this.authService.isAuthenticatedUser();
        if (!isAuth) {
            this.router.navigate([Routes.AdministrationLogin]);
        }
        return isAuth;
    }

    canDeactivate() {
        this.authService.clearAuthentication();
        return true;
    }
}
