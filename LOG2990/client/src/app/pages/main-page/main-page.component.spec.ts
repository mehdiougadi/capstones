import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from '@app/components/general/header/header.component';
import { AdminAccessModalComponent } from '@app/components/main/admin-access-modal/admin-access-modal.component';
import { GameAccessModalComponent } from '@app/components/main/game-access-modal/game-access-modal.component';
import { MainPageComponent } from './main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let router: Router;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        await TestBed.configureTestingModule({
            declarations: [MainPageComponent, HeaderComponent],
            providers: [{ provide: MatDialog, useValue: dialogSpy }],
            imports: [RouterTestingModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open Admin Access Modal on clicking admin button', () => {
        const adminButton = fixture.nativeElement.querySelector('.settings');
        adminButton.click();
        expect(dialogSpy.open).toHaveBeenCalledWith(AdminAccessModalComponent);
    });

    it('should open Game Access Modal on clicking join game button', () => {
        const joinGameButton = fixture.nativeElement.querySelector('button:first-child');
        joinGameButton.click();
        expect(dialogSpy.open).toHaveBeenCalledWith(GameAccessModalComponent);
    });
});
