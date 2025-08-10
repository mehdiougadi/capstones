import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { AdminAuthenticatorService } from '@app/services/authentification/admin-auth.service/admin-auth.service';
import { AdminMessage } from '@common/client-message/admin-acces-pop-up';

@Component({
    selector: 'app-admin-access-modal',
    templateUrl: './admin-access-modal.component.html',
    styleUrls: ['./admin-access-modal.component.scss'],
})
export class AdminAccessModalComponent {
    password: string = '';

    // eslint-disable-next-line max-params
    constructor(
        private readonly router: Router,
        private readonly authenticator: AdminAuthenticatorService,
        private readonly dialogRef: MatDialogRef<AdminAccessModalComponent>,
        private readonly dialog: MatDialog,
    ) {}

    sendPasswordToServer(): void {
        this.authenticator.setEnteredPassword(this.password);
        this.authenticator.passwordValidation().subscribe({
            next: (isValid: boolean) => {
                if (isValid) {
                    this.router.navigate(['/admin']);
                    this.dialogRef.close(true);
                } else {
                    this.password = '';
                    this.router.navigate(['/home']);
                    this.dialog.open(MessageDialogComponent, {
                        data: { message: AdminMessage.WRONG_PASSWORD },
                    });
                }
            },
            error: () => {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: 'Error' },
                });
            },
        });
    }
}
