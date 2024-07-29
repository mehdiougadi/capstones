import { Component, Input } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { Player } from '@common/classes/player';

@Component({
    selector: 'app-player-waiting-list',
    templateUrl: './player-waiting-list.component.html',
    styleUrls: ['./player-waiting-list.component.scss'],
})
export class PlayerWaitingListComponent {
    @Input() currentRoom: Room;
    @Input() adminEditor: boolean = false;

    constructor(private readonly roomManager: RoomManagerService) {}

    banPlayer(player: Player): void {
        this.roomManager.banPlayerFromRoom(player, this.currentRoom);
    }
}
