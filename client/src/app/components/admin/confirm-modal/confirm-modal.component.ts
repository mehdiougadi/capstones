import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { Quiz } from '@common/interfaces/quiz';

@Component({
    selector: 'app-confirm-modal',
    templateUrl: './confirm-modal.component.html',
    styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
    supprimer = '';
    constructor(
        private dialogRef: MatDialogRef<ConfirmModalComponent>,
        private quizManagerService: QuizManagerService,
        @Inject(MAT_DIALOG_DATA) private data: { quizToDelete: Quiz },
    ) {}

    deleteElement(): void {
        this.quizManagerService.deleteQuizFromDB(this.data.quizToDelete);
        this.dialogRef.close();
    }
}
