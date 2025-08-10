import { Component, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private socketClientService: SocketClientService) {}
    ngOnInit(): void {
        this.socketClientService.connect();
    }
}
