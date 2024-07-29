import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminAuthenticatorService } from '@app/services/authentification/admin-auth.service/admin-auth.service';
import { of, throwError } from 'rxjs';
import { AdminAccessModalComponent } from './admin-access-modal.component';

describe('AdminAccessModalComponent', () => {
    let component: AdminAccessModalComponent;
    let fixture: ComponentFixture<AdminAccessModalComponent>;
    let mockMatDialogRef: jasmine.SpyObj<MatDialogRef<AdminAccessModalComponent>>;
    let mockAuthService: jasmine.SpyObj<AdminAuthenticatorService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockMatDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        mockAuthService = jasmine.createSpyObj('AdminAuthenticatorService', ['setEnteredPassword', 'passwordValidation']);
        mockMatDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            declarations: [AdminAccessModalComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: AdminAuthenticatorService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: mockMatDialog },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(AdminAccessModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to admin page if password is valid', () => {
        mockAuthService.passwordValidation.and.returnValue(of(true));
        component.password = 'validPassword';
        component.sendPasswordToServer();

        expect(mockAuthService.setEnteredPassword).toHaveBeenCalledWith('validPassword');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
        expect(mockMatDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should navigate to home page if password is not valid', () => {
        mockAuthService.passwordValidation.and.returnValue(of(false));
        component.password = 'validPassword';
        component.sendPasswordToServer();

        expect(mockAuthService.setEnteredPassword).toHaveBeenCalledWith('validPassword');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        expect(mockMatDialog.open).toHaveBeenCalled();
    });

    it('should handle HTTP error properly', () => {
        component.password = 'validPassword';
        mockAuthService.passwordValidation.and.returnValue(throwError(() => new Error('error test')));

        component.sendPasswordToServer();

        expect(mockAuthService.setEnteredPassword).toHaveBeenCalledWith('validPassword');
        expect(mockAuthService.passwordValidation).toHaveBeenCalled();
        expect(mockMatDialog.open).toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(mockMatDialogRef.close).not.toHaveBeenCalled();
    });
});
