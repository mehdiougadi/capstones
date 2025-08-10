import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { PasswordVerificationService } from './password-verification.service';

describe('PasswordVerificationService', () => {
    let service: PasswordVerificationService;
    let httpTestingController: HttpTestingController;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([{ path: 'admin', component: DummyComponent }])],
            providers: [PasswordVerificationService],
        });
        service = TestBed.inject(PasswordVerificationService);
        httpTestingController = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);

        spyOn(router, 'navigate');
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should validate password and navigate to /admin on success', () => {
        const testPassword = 'testPassword';
        service.passwordValidation(testPassword);

        const req = httpTestingController.expectOne(`${environment.serverUrl}/admin`);
        expect(req.request.method).toEqual('POST');

        req.flush(true);

        expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should not navigate on validation failure', () => {
        const testPassword = 'wrongPassword';
        service.passwordValidation(testPassword);

        const req = httpTestingController.expectOne(`${environment.serverUrl}/admin`);
        req.flush(false);

        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should update isConnected state based on server response', () => {
        expect(service.getStateConnected()).toBeFalse();

        const testPassword = 'testPassword';
        service.passwordValidation(testPassword);

        const req = httpTestingController.expectOne(`${environment.serverUrl}/admin`);
        req.flush(true);

        expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });
    class DummyComponent {}
});
