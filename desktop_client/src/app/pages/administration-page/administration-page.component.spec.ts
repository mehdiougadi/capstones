import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Routes } from '@app/app.constants';
import { CarouselComponent } from '@app/components/carousel/carousel.component';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { HistoriesListComponent } from '@app/components/histories-list/histories-list.component';
import { FileService } from '@app/services/file/file.service';
import { AdministrationPageComponent } from './administration-page.component';

@Component({
    selector: 'app-logo',
})
class LogoStubComponent {}

describe('AdministrationPageComponent', () => {
    let component: AdministrationPageComponent;
    let fixture: ComponentFixture<AdministrationPageComponent>;
    let router: jasmine.SpyObj<Router>;
    let httpTestingController: HttpTestingController;
    let fileService: jasmine.SpyObj<FileService>;
    const dialogMock = {
        open: jasmine.createSpy('open'),
    };

    beforeEach(waitForAsync(() => {
        const fileServiceSpy = jasmine.createSpyObj('FileService', ['importGame']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [AdministrationPageComponent, CarouselComponent, LogoStubComponent],
            providers: [
                { provide: MatDialog, useValue: dialogMock },
                { provide: FileService, useValue: fileServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogMock },
            ],
            imports: [HttpClientModule, HttpClientTestingModule, MatPaginatorModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdministrationPageComponent);
        component = fixture.componentInstance;
        fileService = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
        dialogMock.open.calls.reset();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call importGame and handle "Done" result', async () => {
        const fileInput = document.createElement('input');
        fileService.importGame.and.returnValue(Promise.resolve('Done'));

        await component.importGame(fileInput);

        expect(fileService.importGame).toHaveBeenCalledWith(fileInput);
    });

    it('should call importGame and handle "SystemError" result', async () => {
        const showErrorPopupSpy = spyOn(component, 'showErrorPopup');

        const fileInput = document.createElement('input');
        fileService.importGame.and.returnValue(Promise.resolve('SystemError'));

        await component.importGame(fileInput);

        expect(fileService.importGame).toHaveBeenCalledWith(fileInput);
        expect(showErrorPopupSpy).toHaveBeenCalledWith('Erreur système', "Une erreur s'est produite.");
    });

    it('should call importGame and handle other result', async () => {
        const showErrorPopupSpy = spyOn(component, 'showErrorPopup');

        const fileInput = document.createElement('input');
        const otherResult = 'Invalid format';
        fileService.importGame.and.returnValue(Promise.resolve(otherResult));

        await component.importGame(fileInput);

        expect(fileService.importGame).toHaveBeenCalledWith(fileInput);
        expect(showErrorPopupSpy).toHaveBeenCalledWith('Erreur de format', otherResult);
    });

    it('should handle importGame error', async () => {
        const fileInput = document.createElement('input');
        const importError = new Error('Import error');
        fileService.importGame.and.returnValue(Promise.reject(importError));

        await component.importGame(fileInput);

        expect(fileService.importGame).toHaveBeenCalledWith(fileInput);
    });

    it('should open an error dialog when showErrorPopup is called', () => {
        const customTitle = 'Test Error';
        const errorMessage = 'This is a test error message';

        component.showErrorPopup(customTitle, errorMessage);

        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, {
            data: { title: customTitle, message: errorMessage },
        });
    });

    it('should navigate to "/createQuiz/" when createGame is called', () => {
        component.createGame();

        expect(router.navigate).toHaveBeenCalledWith([Routes.CreateQuiz]);
    });

    it('should open HistoriesListComponent dialog and show result in error popup', () => {
        component.showHistory();

        expect(dialogMock.open).toHaveBeenCalledWith(HistoriesListComponent, { autoFocus: false });
    });
});
