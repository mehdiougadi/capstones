import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminAuthenticatorService } from '@app/services/authentification/admin-auth.service/admin-auth.service';
import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
    let authGuard: AuthGuard;
    let authServiceSpy: jasmine.SpyObj<AdminAuthenticatorService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        const authSpy = jasmine.createSpyObj('AdminAuthenticatorService', ['passwordValidation']);
        const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [AuthGuard, { provide: AdminAuthenticatorService, useValue: authSpy }, { provide: Router, useValue: routerSpyObj }],
        });

        authGuard = TestBed.inject(AuthGuard);
        authServiceSpy = TestBed.inject(AdminAuthenticatorService) as jasmine.SpyObj<AdminAuthenticatorService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    it('should be created', () => {
        expect(authGuard).toBeTruthy();
    });

    describe('canActivate', () => {
        it('should return true and not navigate when authentication is valid', () => {
            authServiceSpy.passwordValidation.and.returnValue(of(true));

            authGuard.canActivate().subscribe((result) => {
                expect(result).toBeTrue();
                expect(routerSpy.navigate).not.toHaveBeenCalled();
            });
        });

        it('should return false and navigate to "/home" when authentication is invalid', () => {
            authServiceSpy.passwordValidation.and.returnValue(of(false));

            authGuard.canActivate().subscribe((result) => {
                expect(result).toBeFalse();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
            });
        });
    });
});
