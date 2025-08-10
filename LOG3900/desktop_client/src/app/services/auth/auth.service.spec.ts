import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL_AUTH } from '@app/app.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let authService: AuthService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AuthService],
        });

        authService = TestBed.inject(AuthService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(authService).toBeTruthy();
    });

    it('should set isAuthenticated to true when calling setAuthenticated', () => {
        authService.setAuthenticated();
        expect(authService.isAuthenticatedUser()).toBe(true);
    });

    it('should set isAuthenticated to false when calling clearAuthentication', () => {
        authService.clearAuthentication();
        expect(authService.isAuthenticatedUser()).toBe(false);
    });

    it('should send a POST request to the API with the password', () => {
        const password = 'testPassword';

        authService.authenticate(password).subscribe((result) => {
            expect(result).toBe(true);
        });

        const req = httpTestingController.expectOne(`${API_URL_AUTH}`);
        expect(req.request.method).toBe('POST');

        req.flush(true);

        httpTestingController.verify();
    });
});
