import { Component, Input } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { ChatMessageSocketService } from '@app/services/sockets/chat-message-socket/chat-message-socket.service';
import { Player } from '@common/classes/player';
import { InteractiveList } from '@common/interfaces/interactive-list';

@Component({
    selector: 'app-interactive-list',
    templateUrl: './interactive-list.component.html',
    styleUrls: ['./interactive-list.component.scss'],
})
export class InteractiveListComponent {
    @Input() currentRoom: Room;
    constructor(
        private readonly chatService: ChatMessageSocketService,
        private readonly roomManagerService: RoomManagerService,
    ) {}

    toggleChatPermission(player: Player): void {
        player.isBannedFromChat = !player.isBannedFromChat;
        this.chatService.togglePlayerChatPermission(player, this.currentRoom);
    }

    setPropertyAndDirection(property: keyof InteractiveList, direction: string): void {
        this.roomManagerService.setPropertyAndDirection(property, direction, this.currentRoom);
    }
}
