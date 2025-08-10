import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ARE_YOU_SURE, POPUP_CONFIRM, Routes } from '@app/app.constants';
import { ConfirmationDialogComponent } from '@app/components/confirmation-dialog/confirmation-dialog.component';
import { Game } from '@app/interfaces/game';
import { GameVisibility } from '@app/interfaces/game-visibility';
import { FileService } from '@app/services/file/file.service';
import { GameService } from '@app/services/game/game.service';
import { saveAs } from 'file-saver';
import { catchError, of } from 'rxjs';
@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
})
export class GameCardComponent implements OnInit {
    @Input() game: Game;
    @Input() isAdministration: boolean;
    @Output() reloadParent: EventEmitter<Game>;
    time: string;

    // tous les params sont nécessaires
    // eslint-disable-next-line max-params
    constructor(
        private readonly gameService: GameService,
        private readonly router: Router,
        private readonly fileService: FileService,
        private readonly dialog: MatDialog,
    ) {
        this.reloadParent = new EventEmitter<Game>();
    }
    ngOnInit(): void {
        if (this.game.lastModification) {
            this.time = new Date(this.game.lastModification).toLocaleDateString() + ' ' + new Date(this.game.lastModification).toLocaleTimeString();
        }
    }

    configureGame() {
        this.router.navigate([Routes.CreateQuiz, this.game.id]);
    }

    deleteGame() {
        if (this.game && this.game.id) {
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                data: {
                    title: POPUP_CONFIRM,
                    message: ARE_YOU_SURE,
                },
            });

            dialogRef.afterClosed().subscribe((result: boolean) => {
                if (result) {
                    this.gameService
                        .deleteGame(this.game.id)
                        .pipe(
                            catchError((error) => {
                                return of(error);
                            }),
                        )
                        .subscribe(() => {
                            this.reloadParent.emit(this.game);
                        });
                }
            });
        }
    }

    changeVisibility() {
        if (this.game && this.game.id) {
            const gameVisibility: GameVisibility = { id: this.game.id, isVisible: !this.game.isVisible };
            this.gameService
                .updateGame(this.game.id, gameVisibility)
                .pipe(
                    catchError((error) => {
                        return of(error);
                    }),
                )
                .subscribe(() => {
                    this.game.isVisible = !this.game.isVisible;
                });
        }
    }

    exportGame() {
        this.fileService
            .exportGame(this.game.id)
            .pipe(
                catchError((error) => {
                    return of(error);
                }),
            )
            .subscribe((data) => {
                const blob = new Blob([data], { type: 'application/json' });
                saveAs(blob, this.game.title + '.json');
            });
    }
}
