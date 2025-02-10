import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-error-popup',
    templateUrl: './error-popup.component.html',
})
export class ErrorPopupComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string },
        private readonly dialogRef: MatDialogRef<ErrorPopupComponent>,
    ) {}

    closeDialog(): void {
        this.dialogRef.close();
    }
}
