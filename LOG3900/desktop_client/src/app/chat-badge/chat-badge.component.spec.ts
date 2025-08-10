/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '@app/interfaces/message';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { ChatBadgeComponent } from './chat-badge.component';

describe('ChatBadgeComponent', () => {
    let component: ChatBadgeComponent;
    let fixture: ComponentFixture<ChatBadgeComponent>;
    let socketServiceMock: any;

    beforeEach(() => {
        socketServiceMock = {
            on: jasmine.createSpy('on'),
            socket: {
                removeAllListeners: jasmine.createSpy('removeAllListeners'),
            },
        };

        TestBed.configureTestingModule({
            declarations: [ChatBadgeComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
            imports: [MatIconModule],
        });

        fixture = TestBed.createComponent(ChatBadgeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize badgeCount and retrievingMessageHistory correctly', () => {
        expect(component.badgeCount).toBe(0);
        expect(component.retrievingMessageHistory).toBeTrue();
    });

    it('should reset badgeCount when chat is opened', () => {
        component.ngOnChanges({
            chatOpened: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
        });
        expect(component.badgeCount).toBe(0);
    });

    it('should remove all listeners on ngOnDestroy', () => {
        component.ngOnDestroy();
        expect(socketServiceMock.socket.removeAllListeners).toHaveBeenCalled();
    });

    it('should increment badgeCount on new message if chat is not opened and not retrieving history', () => {
        component.chatOpened = false;
        component.retrievingMessageHistory = false;
        const registerCallback = socketServiceMock.on.calls.mostRecent().args[1];
        registerCallback([{} as Message]);
        expect(component.badgeCount).toBe(1);
    });

    it('should not increment badgeCount on new message if retrieving history', () => {
        component.retrievingMessageHistory = true;
        const callback = socketServiceMock.on.calls.mostRecent().args[1];
        callback([{} as Message]);
        expect(component.badgeCount).toBe(0);
    });
});
