import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { AdminAuthenticatorService } from './admin-auth.service';

describe('AdminAuthenticatorService', () => {
    let service: AdminAuthenticatorService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AdminAuthenticatorService],
        });

        service = TestBed.inject(AdminAuthenticatorService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set and get entered password', () => {
        const testPassword = 'testPassword';
        service.setEnteredPassword(testPassword);

        expect(service['enteredPassword']).toEqual(testPassword);
    });

    it('should validate password and navigate to /admin on success', () => {
        const testPassword = 'testPassword';
        const requestBody = { password: testPassword };
        const url = `${environment.serverUrl}/admin`;

        service.setEnteredPassword(testPassword);

        service.passwordValidation().subscribe((response) => {
            expect(response).toBeTruthy();
        });

        const req = httpTestingController.expectOne(url);
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(requestBody);

        req.flush(true);

        httpTestingController.verify();
    });
});
