import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Routes } from '@app/app.constants';
import { AuthService } from '@app/services/auth/auth.service';
import { of, throwError } from 'rxjs';
import { AdministrationLoginComponent } from './administration-login.component';

@Component({
    selector: 'app-logo',
})
class LogoStubComponent {}

describe('AdministrationLoginComponent', () => {
    let component: AdministrationLoginComponent;
    let fixture: ComponentFixture<AdministrationLoginComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(() => {
        authService = jasmine.createSpyObj('AuthService', ['authenticate', 'setAuthenticated']);
        router = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [AdministrationLoginComponent, LogoStubComponent],
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: router },
            ],
        });

        fixture = TestBed.createComponent(AdministrationLoginComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to /administration on successful authentication', () => {
        const password = 'validPassword';
        authService.authenticate.and.returnValue(of(true));

        component.password = password;
        component.onSubmit();

        expect(authService.authenticate).toHaveBeenCalledWith(password);
        expect(authService.setAuthenticated).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([Routes.Administration]);
    });

    it('should set errorMessage on incorrect password', () => {
        const password = 'invalidPassword';
        authService.authenticate.and.returnValue(of(false));

        component.password = password;
        component.onSubmit();

        expect(authService.authenticate).toHaveBeenCalledWith(password);
        expect(authService.setAuthenticated).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(component.errorMessage).toBe('Mot de passe incorrect, veuillez réessayer');
        expect(component.password).toBe('');
    });

    it('should handle HTTP request error', () => {
        const password = 'validPassword';
        authService.authenticate.and.returnValue(throwError(() => new Error('HTTP error')));

        spyOn(console, 'error');

        component.password = password;
        component.onSubmit();

        expect(authService.authenticate).toHaveBeenCalledWith(password);
        expect(authService.setAuthenticated).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
