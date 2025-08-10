import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AddPlayerResponse } from '@app/common-client/interfaces/add-player';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { Player } from '@common/classes/player';
import { of } from 'rxjs';
import { GameAccessModalComponent } from './game-access-modal.component';

describe('GameAccessModalComponent', () => {
    let component: GameAccessModalComponent;
    let fixture: ComponentFixture<GameAccessModalComponent>;
    let gameManagerSpy: jasmine.SpyObj<GameManager>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<GameAccessModalComponent>>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    beforeEach(() => {
        gameManagerSpy = jasmine.createSpyObj('RoomManagerService', ['joinRoom']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            declarations: [GameAccessModalComponent],
            schemas: [NO_ERRORS_SCHEMA],
            imports: [HttpClientModule],
            providers: [
                { provide: GameManager, useValue: gameManagerSpy },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
        fixture = TestBed.createComponent(GameAccessModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('accessGame should navigate to room on successful join', () => {
        const mockResponse: AddPlayerResponse = { id: '123', msg: '' };
        gameManagerSpy.joinRoom.and.returnValue(of(mockResponse));
        component.username = 'JohnDoe';
        component.accessCode = 'ABC123';

        component.accessGame();

        expect(sessionStorage.getItem('currentPlayer')).toEqual(JSON.stringify(new Player('JohnDoe')));
        expect(gameManagerSpy.joinRoom).toHaveBeenCalledWith('JohnDoe', 'ABC123', false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/room/123']);
        expect(matDialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('accessGame should show message dialog on unsuccessful join', () => {
        const mockResponse = { id: '', msg: 'Invalid access code' };
        gameManagerSpy.joinRoom.and.returnValue(of(mockResponse));
        component.username = 'JohnDoe';
        component.accessCode = 'InvalidCode';

        component.accessGame();

        expect(sessionStorage.getItem('currentPlayer')).toEqual(JSON.stringify(new Player('JohnDoe')));
        expect(gameManagerSpy.joinRoom).toHaveBeenCalledWith('JohnDoe', 'InvalidCode', false);
        expect(matDialogSpy.open).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message: 'Invalid access code' },
        });
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(matDialogRefSpy.close).not.toHaveBeenCalled();
    });
});
