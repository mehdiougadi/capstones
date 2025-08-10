import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameMessage } from '@common/client-message/game-pop-up';

@Component({
    selector: 'app-give-up-button',
    templateUrl: './give-up-button.component.html',
    styleUrls: ['./give-up-button.component.scss'],
})
export class GiveUpButtonComponent {
    @Input() isTestingQuiz: boolean = false;
    @Input() roomId: string;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private gameControllerService: GameControllerService,
    ) {}

    onGiveUpClick(): void {
        this.openGiveUpDialog();
        if (this.isTestingQuiz) {
            this.abandonGame();
        } else {
            this.navigateToHome();
        }
    }

    private openGiveUpDialog(): void {
        this.dialog.open(MessageDialogComponent, {
            data: { message: GameMessage.GIVE_UP_GAME },
        });
    }

    private abandonGame(): void {
        this.gameControllerService.deleteRoom(this.roomId).subscribe({
            next: () => {
                this.router.navigate(['/create-game']);
            },
        });
    }

    private navigateToHome(): void {
        this.router.navigate(['/home']);
    }
}
