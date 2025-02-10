/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ARE_YOU_SURE, ERROR_DELETE_HISTORY, ERROR_DOWNLOAD_HISTORY, POPUP_CONFIRM } from '@app/app.constants';
import { ConfirmationDialogComponent } from '@app/components/confirmation-dialog/confirmation-dialog.component';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { History } from '@app/interfaces/history';
import { HistoryService } from '@app/services/history/history.service';
import { Subscription } from 'rxjs';
@Component({
    selector: 'app-histories-list',
    templateUrl: './histories-list.component.html',
    styleUrls: ['./histories-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class HistoriesListComponent implements OnInit, OnDestroy {
    histories: History[];
    historySubscription: Subscription;
    loading: boolean;

    sortedNameASC: boolean;
    sortedNameDESC: boolean;
    sortedDateASC: boolean;
    sortedDateDESC: boolean;

    constructor(
        private historyService: HistoryService,
        private readonly dialog: MatDialog,
    ) {
        this.histories = [];
        this.loading = false;
        this.sortedNameASC = false;
        this.sortedNameDESC = false;
        this.sortedDateASC = false;
        this.sortedDateDESC = false;
    }

    ngOnInit(): void {
        this.fetchHistories();
    }

    ngOnDestroy(): void {
        if (this.historySubscription) {
            this.historySubscription.unsubscribe();
        }
    }

    async fetchHistories(): Promise<void> {
        this.loading = true;
        this.historySubscription = this.historyService.getAllHistory().subscribe({
            next: (histories) => {
                this.histories = histories;
            },
            error: (error) => {
                this.showErrorPopup(ERROR_DOWNLOAD_HISTORY, error);
            },
            complete: () => {
                this.loading = false;
                this.sortHistoriesDateDesc();
            },
        });
    }

    deleteAllHistories(): void {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            data: {
                title: POPUP_CONFIRM,
                message: ARE_YOU_SURE,
            },
        });

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.historyService.deleteAllHistories().subscribe({
                    next: () => {
                        this.fetchHistories();
                    },
                    error: (error) => {
                        this.showErrorPopup(ERROR_DELETE_HISTORY, error);
                    },
                });
            }
        });
    }

    sortName() {
        if (this.sortedNameASC) {
            this.sortHistoriesNameDesc();
        } else {
            this.sortHistoriesNameAsc();
        }
    }

    sortDate() {
        if (this.sortedDateASC) {
            this.sortHistoriesDateDesc();
        } else {
            this.sortHistoriesDateAsc();
        }
    }

    closePopup() {
        this.dialog.closeAll();
    }

    private setSortingFlags(flags: { nameAsc: boolean; nameDesc: boolean; dateAsc: boolean; dateDesc: boolean }): void {
        this.sortedNameASC = flags.nameAsc;
        this.sortedNameDESC = flags.nameDesc;
        this.sortedDateASC = flags.dateAsc;
        this.sortedDateDESC = flags.dateDesc;
    }

    private sortHistoriesNameAsc(): void {
        this.histories.sort((a, b) => (a.gameTitle.toLowerCase() > b.gameTitle.toLowerCase() ? 1 : -1));
        this.setSortingFlags({ nameAsc: true, nameDesc: false, dateAsc: false, dateDesc: false });
    }

    private sortHistoriesNameDesc(): void {
        this.histories.sort((a, b) => (a.gameTitle.toLowerCase() > b.gameTitle.toLowerCase() ? -1 : 1));
        this.setSortingFlags({ nameAsc: false, nameDesc: true, dateAsc: false, dateDesc: false });
    }

    private sortHistoriesDateAsc(): void {
        this.histories.sort((a, b) => (a.date > b.date ? 1 : -1));
        this.setSortingFlags({ nameAsc: false, nameDesc: false, dateAsc: true, dateDesc: false });
    }

    private sortHistoriesDateDesc(): void {
        this.histories.sort((a, b) => (a.date > b.date ? -1 : 1));
        this.setSortingFlags({ nameAsc: false, nameDesc: false, dateAsc: false, dateDesc: true });
    }

    private showErrorPopup(customTitle: string, errorMessage: string): void {
        this.dialog.open(ErrorPopupComponent, {
            data: { title: customTitle, message: errorMessage },
        });
    }
}
