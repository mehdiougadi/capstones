import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { Player } from '@common/classes/player';

@Component({
    selector: 'app-game-access-modal',
    templateUrl: './game-access-modal.component.html',
    styleUrls: ['./game-access-modal.component.scss'],
})
export class GameAccessModalComponent {
    username: string = '';
    accessCode: string;

    // eslint-disable-next-line max-params
    constructor(
        private readonly gameManager: GameManager,
        private readonly dialogRef: MatDialogRef<GameAccessModalComponent>,
        private readonly dialog: MatDialog,
        private readonly router: Router,
    ) {}

    accessGame(): void {
        sessionStorage.setItem('currentPlayer', JSON.stringify(new Player(this.username)));
        this.gameManager.joinRoom(this.username, this.accessCode, false).subscribe({
            next: (res) => {
                if (res.id) {
                    this.router.navigate([`/room/${res.id}`]);
                    this.dialogRef.close(true);
                } else if (res.msg) {
                    this.dialog.open(MessageDialogComponent, {
                        data: { message: res.msg },
                    });
                }
            },
        });
    }
}
