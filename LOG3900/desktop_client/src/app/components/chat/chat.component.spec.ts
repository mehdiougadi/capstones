// retrait du lint any pour accéder aux attributs privés
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Message } from '@app/interfaces/message';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';
import { ChatComponent } from './chat.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            declarations: [ChatComponent],
            providers: [{ provide: SocketClientService, useValue: socketService }],
            imports: [FormsModule, MatIconModule],
        });
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('ngOnInit should call the right function', () => {
        spyOn(component, 'listenForNewMessage');
        spyOn(component, 'retrieveMessageHistory');
        spyOn(component, 'retrievePlayerName');
        spyOn(component, 'listenForToggleChatPermission');
        spyOn(socketService, 'send');
        component.ngOnInit();
        expect(component.listenForNewMessage).toHaveBeenCalled();
        expect(component.retrieveMessageHistory).toHaveBeenCalled();
        expect(component.retrievePlayerName).toHaveBeenCalled();
        expect(component.listenForToggleChatPermission).toHaveBeenCalled();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get socketId', () => {
        // pour modifier l'attribut id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketService.socket as any).id = 'a234';
        expect(component.socketId).toEqual('a234');
        // pour modifier l'attribut id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketService.socket as any).id = undefined;
        expect(component.socketId).toEqual('');
    });

    it('should stop propagation for forbidden keys if chat input is active', () => {
        component.chatVisible = true;
        fixture.detectChanges();

        const chatInputDebugElement = fixture.debugElement.query(By.css('input[type=text]'));

        const chatInputElement = chatInputDebugElement.nativeElement;
        chatInputElement.focus();

        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(event, 'stopPropagation');
        document.dispatchEvent(event);

        expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('ngOnDestroy should remove all the listener', () => {
        spyOn(socketHelper, 'removeAllListeners');

        component.ngOnDestroy();

        expect(socketHelper.removeAllListeners).toHaveBeenCalled();
    });

    it('listenForNewMessage should update the messages in the room if he receives a new one', () => {
        const roomMessages = [{ playerName: 'Jasmine', message: 'bonjour', time: '4:30pm' }];
        component.listenForNewMessage();
        socketHelper.peerSideEmit(SocketClientEventsListen.RoomMessages, roomMessages);

        component.listenForNewMessage();

        expect(component.roomMessages).toBe(roomMessages);
    });

    it('retrieveMessageHistory should get the messages written in this room', () => {
        spyOn(socketService, 'send');
        component.retrieveMessageHistory();
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestMessageHistory);
    });

    it('retrievePlayerName should get the name of the player that wrote a certain message', () => {
        (component as any).playerName = 'Jasmine';
        spyOn(socketService, 'send');
        component.retrievePlayerName();
        socketHelper.peerSideEmit(SocketClientEventsListen.PlayerName, 'Jasmine');
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.RequestName);
        expect((component as any).playerName).toEqual('Jasmine');
    });
    it('listenForToggleChatPermission should switch canChat ', () => {
        component.canChat = true;

        socketHelper.peerSideEmit(SocketClientEventsListen.ToggleChatPermission);
        component.listenForToggleChatPermission();

        expect(component.canChat).toBe(false);
    });

    it('checkSizeMessage should return true when input message length is less than MAX_LENGTH_MESSAGE', () => {
        component.inputMessage = 'Short message';
        const result = component.checkSizeMessage();
        expect(result).toBe(true);
    });

    it('should send a new message when input message size is within limits and not empty', () => {
        (component as any).playerName = 'Alice';
        component.inputMessage = 'Test message';
        (component as any).time = '12:00 PM';
        spyOn(component, 'checkSizeMessage').and.returnValue(true);
        spyOn(component, 'checkEmptyMessage').and.returnValue(true);
        spyOn((component as any).socketService, 'send');
        component.sendNewMessage();
        expect((component as any).roomMessage).toEqual(
            jasmine.objectContaining({
                playerName: 'Alice',
                message: 'Test message',
                time: '12:00 PM',
            }),
        );
        expect((component as any).socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.NewMessage, jasmine.any(Object));
        expect(component.inputMessage).toBe('');
    });

    it('checkEmptyMessage should return true when input message is not empty', () => {
        component.inputMessage = 'Non-empty message';
        const result = component.checkEmptyMessage();
        expect(result).toBe(true);
    });

    it('checkEmptyMessage should return false when input message is empty', () => {
        component.inputMessage = '';
        const result = component.checkEmptyMessage();
        expect(result).toBe(false);
    });

    it('should return true for messages sent by the current user', () => {
        (component as any).playerName = 'Alice';
        const messageFromCurrentUser: Message = { playerName: 'Alice', message: 'Hello', time: '12:00 PM' };
        const result = component.isCurrentUserMessage(messageFromCurrentUser);
        expect(result).toBe(true);
    });

    it('should return false for messages sent by a different user', () => {
        const messageFromOtherUser: Message = { playerName: 'Bob', message: 'Hi', time: '1:00 PM' };
        const result = component.isCurrentUserMessage(messageFromOtherUser);
        expect(result).toBe(false);
    });

    it('should initialize chatVisible to false', () => {
        expect(component.chatVisible).toBe(false);
    });

    it('should toggle chatVisible from false to true', () => {
        expect(component.chatVisible).toBe(false);
        component.toggleChat();
        expect(component.chatVisible).toBe(true);
    });

    it('should toggle chatVisible from true to false', () => {
        component.chatVisible = true;
        component.toggleChat();
        expect(component.chatVisible).toBe(false);
    });

    it('should return true when inputMessage is not empty', () => {
        component.inputMessage = 'Non-empty message';
        const result = component.checkEmptyMessage();
        expect(result).toBe(true);
    });

    it('should scroll to bottom of chat messages', (done) => {
        const mockElement = {
            scrollTop: 0,
            scrollHeight: 100,
        };
        (component as any).chatMessages = {
            nativeElement: mockElement,
        };
        component.scrollToBottom();
        setTimeout(() => {
            expect(mockElement.scrollTop).toBe(mockElement.scrollHeight);
            done();
        }, 1);
    });

    it('should emit true when onToggleClick is called', () => {
        spyOn(component.toggleSidebar, 'emit');
        component.onToggleClick();
        expect(component.toggleSidebar.emit).toHaveBeenCalledWith(true);
    });
});
