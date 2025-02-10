import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
    let authGuard: AuthGuard;
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(() => {
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticatedUser', 'clearAuthentication']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [AuthGuard, { provide: AuthService, useValue: authServiceSpy }, { provide: Router, useValue: routerSpy }],
        });

        authGuard = TestBed.inject(AuthGuard);
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    it('should be created', () => {
        expect(authGuard).toBeTruthy();
    });

    describe('canActivate', () => {
        it('should return true if the user is authenticated', () => {
            authService.isAuthenticatedUser.and.returnValue(true);
            const canActivate = authGuard.canActivate();
            expect(canActivate).toBe(true);
        });

        it('should navigate to /administrationLogin and return false if the user is not authenticated', () => {
            authService.isAuthenticatedUser.and.returnValue(false);
            const canActivate = authGuard.canActivate();
            expect(canActivate).toBe(false);
            expect(router.navigate).toHaveBeenCalledWith(['/administrationLogin']);
        });
    });

    describe('canDeactivate', () => {
        it('should clear authentication and return true', () => {
            const canDeactivate = authGuard.canDeactivate();
            expect(canDeactivate).toBe(true);
            expect(authService.clearAuthentication).toHaveBeenCalled();
        });
    });
});
