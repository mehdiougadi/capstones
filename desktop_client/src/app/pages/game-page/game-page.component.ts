import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { GameMode, Routes, SocketServerEventsSend } from '@app/app.constants';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    @ViewChild('sidenav') sidenav: MatSidenav;
    gameId: string;
    gameMode: GameMode;

    // les quatre paramètre sont nécessaire
    // eslint-disable-next-line max-params
    constructor(
        private readonly navigationService: NavigationService,
        private route: ActivatedRoute,
        private socketClientService: SocketClientService,
        private router: Router,
    ) {}

    ngOnInit() {
        const gameId: string | null = this.route.snapshot.paramMap.get('id');
        const gameMode: string | null = this.route.snapshot.paramMap.get('mode');

        if (this.navigationService.verifyPreviousRoute(Routes.Game)) {
            this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
            this.router.navigate([Routes.Home]);
        } else if (gameId && gameMode) {
            this.gameId = gameId;
            this.gameMode = gameMode === GameMode.Test ? GameMode.Test : GameMode.Player;
        } else {
            this.router.navigate([Routes.Home]);
        }
    }
}
