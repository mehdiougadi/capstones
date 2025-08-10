import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CONGRATULATION, ERROR_OCCURRED, FORMAT_ERROR, IMPORT_SUCCESS, Routes, SYSTEM_ERROR } from '@app/app.constants';
import { CarouselComponent } from '@app/components/carousel/carousel.component';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { HistoriesListComponent } from '@app/components/histories-list/histories-list.component';
import { FileService } from '@app/services/file/file.service';

@Component({
    selector: 'app-administration-page',
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
})
export class AdministrationPageComponent {
    @ViewChild(CarouselComponent, { static: false }) carousel: CarouselComponent;
    protected disabled: boolean;
    constructor(
        private readonly dialog: MatDialog,
        private readonly fileService: FileService,
        private readonly router: Router,
    ) {
        this.disabled = true;
    }

    showErrorPopup(customTitle: string, errorMessage: string): void {
        this.dialog.open(ErrorPopupComponent, {
            data: { title: customTitle, message: errorMessage },
        });
    }

    async importGame(fileInput: HTMLInputElement) {
        this.fileService
            .importGame(fileInput)
            .then((result) => {
                if (result === 'Done') {
                    this.showErrorPopup(CONGRATULATION, IMPORT_SUCCESS);
                    this.carousel.reloadComponent();
                } else if (result === 'SystemError') {
                    this.showErrorPopup(SYSTEM_ERROR, ERROR_OCCURRED);
                } else {
                    this.showErrorPopup(FORMAT_ERROR, result);
                }
                fileInput.value = '';
            })
            .catch(() => {
                return;
            });
    }

    createGame() {
        this.router.navigate([Routes.CreateQuiz]);
    }

    showHistory(): void {
        this.dialog.open(HistoriesListComponent, {
            autoFocus: false,
        });
    }
}
