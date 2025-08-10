import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '@app/components/game/chat/sidebar.component';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { Player } from '@common/classes/player';
import { Message } from '@common/interfaces/message';
import { Subject } from 'rxjs';

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;
    let mockGameControllerService: jasmine.SpyObj<GameControllerService>;

    beforeEach(async () => {
        mockGameControllerService = jasmine.createSpyObj('GameControllerService', ['isInputFocused']);
        await TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [SidebarComponent],
            providers: [
                { provide: GameControllerService, useValue: mockGameControllerService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'roomId' } } } },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        component.currentPlayer = new Player('Test Player');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not send empty message', () => {
        const spyChatService = spyOn(component['chatService'], 'sendMessage');
        component.sendMessage('   ');

        expect(spyChatService).not.toHaveBeenCalled();
    });

    it('should send valid message', () => {
        const spyChatService = spyOn(component['chatService'], 'sendMessage');
        component.sendMessage('Hello ');

        expect(spyChatService).toHaveBeenCalled();
    });

    it('should set isInputFocused to true on input focus', () => {
        component.onInputFocus();
        expect(mockGameControllerService.isInputFocused).toBeTrue();
    });

    it('should set isInputFocused to false on input blur', () => {
        component.onInputBlur();
        expect(mockGameControllerService.isInputFocused).toBeFalse();
    });

    it('should add message to listMessages when receiving a new message', () => {
        const message: Message = { author: 'Test Author', time: new Date().toString(), message: 'Test Message' };
        const messageSubject = new Subject<Message>();
        spyOn(component['chatService'], 'getMessage').and.returnValue(messageSubject);

        component.ngOnInit();
        messageSubject.next(message);
        expect(component.listMessages).toContain(message);
    });
});
