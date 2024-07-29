import { Component, Input, OnInit } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { Player } from '@common/classes/player';

@Component({
    selector: 'app-results-view',
    templateUrl: './results-view.component.html',
    styleUrls: ['./results-view.component.scss'],
})
export class ResultsViewComponent implements OnInit {
    @Input() roomId: string;
    @Input() currentRoom: Room;
    indexQuestion = 0;
    listPlayers: Player[] = [];
    isGameOver: boolean = true;
    isResultsPage: boolean = true;

    constructor(private gameControllerService: GameControllerService) {}

    ngOnInit(): void {
        if (this.roomId) {
            this.gameControllerService.getGameInfo(this.roomId).subscribe((room) => {
                this.listPlayers = room.listPlayers;
                this.currentRoom = room;
            });
        }
    }
}
