import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { ChatMessageSocketService } from '@app/services/sockets/chat-message-socket/chat-message-socket.service';
import { Player } from '@common/classes/player';
import { Message } from '@common/interfaces/message';
import { Subscription } from 'rxjs';
@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
    @Input() currentPlayer: Player;
    @Input() isPlayer: boolean = true;
    listMessages: Message[] = [];
    newMessage: string = '';
    private chatSubscription: Subscription;
    private storageKey: string = 'listeMessages';
    constructor(
        private gameControllerService: GameControllerService,
        private readonly chatService: ChatMessageSocketService,
        private readonly route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.chatService.connect();
        this.chatService.listenMessage();
        const roomId = this.route.snapshot.paramMap.get('id');
        if (roomId) {
            this.chatService.connectChatToRoom(roomId);
        }
        this.retrieveMessages();
        this.chatSubscription = this.chatService.getMessage().subscribe((message: Message) => {
            this.listMessages.push(message);
        });
    }

    sendMessage(message: string): void {
        if (message.trim()) {
            this.chatService.sendMessage({
                author: this.currentPlayer.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                message,
            });
        }
        this.newMessage = '';
    }

    onInputFocus(): void {
        this.gameControllerService.isInputFocused = true;
    }

    onInputBlur(): void {
        this.gameControllerService.isInputFocused = false;
    }

    storeMessages(): void {
        sessionStorage.setItem(this.storageKey, JSON.stringify(this.listMessages));
    }

    retrieveMessages(): void {
        const storedMessages = sessionStorage.getItem(this.storageKey);
        if (storedMessages) {
            this.listMessages = JSON.parse(storedMessages);
        }
    }

    ngOnDestroy(): void {
        this.storeMessages();
        this.chatSubscription?.unsubscribe();
        this.chatService?.disconnect();
    }
}
