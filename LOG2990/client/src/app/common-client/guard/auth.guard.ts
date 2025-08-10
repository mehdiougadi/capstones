import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthenticatorService } from '@app/services/authentification/admin-auth.service/admin-auth.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard {
    constructor(
        private router: Router,
        private authService: AdminAuthenticatorService,
    ) {}

    canActivate(): Observable<boolean> {
        return this.authService.passwordValidation().pipe(
            tap((isValid) => {
                if (!isValid) {
                    this.router.navigate(['/home']);
                }
            }),
        );
    }
}
