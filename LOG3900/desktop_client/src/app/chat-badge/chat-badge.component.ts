import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { SocketClientEventsListen } from '@app/app.constants';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-chat-badge',
    templateUrl: './chat-badge.component.html',
    styleUrls: ['./chat-badge.component.scss'],
})
export class ChatBadgeComponent implements OnInit, OnDestroy, OnChanges {
    @Input() chatOpened: boolean;
    badgeCount: number;
    retrievingMessageHistory: boolean;

    constructor(private readonly socketService: SocketClientService) {}

    ngOnInit(): void {
        this.listenForNewMessage();
        this.badgeCount = 0;
        this.retrievingMessageHistory = true;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.chatOpened && changes.chatOpened.currentValue === true) {
            this.badgeCount = 0;
        }
    }

    ngOnDestroy() {
        this.socketService.socket.removeAllListeners();
    }

    listenForNewMessage() {
        this.socketService.on(SocketClientEventsListen.RoomMessages, () => {
            if (this.retrievingMessageHistory) {
                this.retrievingMessageHistory = false;
            } else if (!this.chatOpened) {
                this.badgeCount += 1;
            }
        });
    }
}
