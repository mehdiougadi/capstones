import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Routes, SocketServerEventsSend } from '@app/app.constants';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss'],
})
export class LogoComponent {
    isHomePage: boolean;
    isAdminPage: boolean;
    isPlayPage: boolean;

    constructor(
        private readonly router: Router,
        private readonly socketClientService: SocketClientService,
    ) {
        this.isHomePage = false;
        this.isAdminPage = false;
        this.isPlayPage = false;
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const path = this.router.url;
                this.isHomePage = path.includes(Routes.Home);
                this.isAdminPage = path.includes(Routes.Administration) || path.includes(Routes.CreateQuiz);
                this.isPlayPage = path.includes(Routes.Game);
            }
        });
    }

    navigateToHome() {
        this.socketClientService.send(SocketServerEventsSend.RequestRoomId);
        this.router.navigate([Routes.Home]);
    }
}
