import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FORBIDDEN_KEYS, MAX_LENGTH_MESSAGE, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { Message } from '@app/interfaces/message';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
    @Output() toggleSidebar;
    @ViewChild('chatMessages', { static: false }) private chatMessages: ElementRef;
    @ViewChild('chatInput', { static: false }) private chatInput: ElementRef;
    chatVisible: boolean;
    canChat: boolean;
    inputMessage: string;
    roomMessages: Message[];
    errorSizeMessage: string;
    private playerName: string;
    private time: string;
    private roomMessage: Message;

    constructor(private readonly socketService: SocketClientService) {
        this.inputMessage = '';
        this.errorSizeMessage = '';
        this.toggleSidebar = new EventEmitter<boolean>();
        this.chatVisible = false;
        this.canChat = true;
    }

    get socketId() {
        return this.socketService.socket.id ? this.socketService.socket.id : '';
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (
            this.chatInput &&
            this.chatInput.nativeElement === document.activeElement &&
            (FORBIDDEN_KEYS.includes(event.code) || event.key === 'Enter')
        ) {
            event.stopPropagation();
        }
    }

    ngOnInit(): void {
        this.listenForNewMessage();
        this.retrieveMessageHistory();
        this.retrievePlayerName();
        this.listenForToggleChatPermission();
    }

    ngOnDestroy() {
        this.socketService.socket.removeAllListeners();
    }

    retrievePlayerName() {
        this.socketService.on(SocketClientEventsListen.PlayerName, (playerName: string) => {
            this.playerName = playerName;
        });
        this.socketService.send(SocketServerEventsSend.RequestName);
    }
    checkSizeMessage(): boolean {
        return this.inputMessage.length < MAX_LENGTH_MESSAGE;
    }

    checkEmptyMessage(): boolean {
        return this.inputMessage !== '';
    }

    retrieveMessageHistory() {
        this.socketService.send(SocketServerEventsSend.RequestMessageHistory);
    }

    listenForToggleChatPermission() {
        this.socketService.on(SocketClientEventsListen.ToggleChatPermission, () => {
            this.canChat = !this.canChat;
        });
    }

    sendNewMessage() {
        if (this.checkSizeMessage() && this.checkEmptyMessage()) {
            this.roomMessage = new Message(this.playerName, this.inputMessage, this.time);
            this.socketService.send(SocketServerEventsSend.NewMessage, this.roomMessage);
            this.inputMessage = '';
            this.scrollToBottom();
        }
    }

    listenForNewMessage() {
        this.socketService.on(SocketClientEventsListen.RoomMessages, (roomMessages: Message[]) => {
            this.roomMessages = roomMessages;
            this.scrollToBottom();
        });
    }

    isCurrentUserMessage(message: Message): boolean {
        return this.playerName === message.playerName;
    }

    toggleChat() {
        this.chatVisible = !this.chatVisible;
    }

    scrollToBottom(): void {
        setTimeout(() => {
            this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
        }, 0);
    }

    onToggleClick(): void {
        this.toggleSidebar.emit(true);
    }
}
