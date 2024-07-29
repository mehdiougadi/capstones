import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameMessage } from '@common/client-message/game-pop-up';
import { of } from 'rxjs';
import { GiveUpButtonComponent } from './give-up-button.component';

describe('GiveUpButtonComponent', () => {
    let component: GiveUpButtonComponent;
    let fixture: ComponentFixture<GiveUpButtonComponent>;
    let router: Router;
    let dialog: MatDialog;
    let mockGameControllerService: jasmine.SpyObj<GameControllerService>;
    beforeEach(() => {
        mockGameControllerService = jasmine.createSpyObj('', ['deleteRoom']);
        TestBed.configureTestingModule({
            declarations: [GiveUpButtonComponent],
            imports: [RouterTestingModule, MatDialogModule],
            providers: [{ provide: GameControllerService, useValue: mockGameControllerService }],
        }).compileComponents();

        fixture = TestBed.createComponent(GiveUpButtonComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        dialog = TestBed.inject(MatDialog);

        spyOn(router, 'navigate');
        spyOn(dialog, 'open');
        fixture.detectChanges();
        mockGameControllerService.deleteRoom.and.returnValue(of(true));
    });

    it('should open dialog with correct message', () => {
        component.onGiveUpClick();
        expect(dialog.open).toHaveBeenCalledOnceWith(jasmine.any(Function), {
            data: { message: GameMessage.GIVE_UP_GAME },
        });
    });

    it('should finish round and navigate to /create-game if isTestingQuiz is true', () => {
        component.isTestingQuiz = true;
        component.onGiveUpClick();
        expect(router.navigate).toHaveBeenCalledWith(['/create-game']);
    });

    it('should finish round and navigate to /home if isTestingQuiz is false', () => {
        component.isTestingQuiz = false;
        component.onGiveUpClick();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
});
