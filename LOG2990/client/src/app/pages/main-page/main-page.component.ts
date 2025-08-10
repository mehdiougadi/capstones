import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StateHeader } from '@app/common-client/constant/state';
import { AdminAccessModalComponent } from '@app/components/main/admin-access-modal/admin-access-modal.component';
import { GameAccessModalComponent } from '@app/components/main/game-access-modal/game-access-modal.component';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    currentStateHeader: StateHeader = StateHeader.HOME;
    constructor(public dialog: MatDialog) {}

    showModalLogin(): void {
        this.dialog.open(AdminAccessModalComponent);
    }

    showModalAccessGame(): void {
        sessionStorage.removeItem('listeMessages');
        this.dialog.open(GameAccessModalComponent);
    }
}
