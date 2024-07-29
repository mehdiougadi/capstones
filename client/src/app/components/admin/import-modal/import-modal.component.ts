import { Component, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { ImportQuizJsonService } from '@app/services/utils/Import/import-quiz-json.service';
import { Quiz } from '@common/interfaces/quiz';

@Component({
    selector: 'app-import-modal',
    templateUrl: './import-modal.component.html',
    styleUrls: ['./import-modal.component.scss'],
})
export class ImportModalComponent {
    title = '';
    constructor(
        private injector: Injector,
        private dialogRef: MatDialogRef<ImportModalComponent>,
        @Inject(MAT_DIALOG_DATA) private data: { quiz: Quiz },
    ) {}

    sendNewTitle(): void {
        const quizManagerService = this.injector.get(QuizManagerService);
        if (this.injector.get(ImportQuizJsonService).createQuiz(this.data.quiz, this.title)) {
            quizManagerService.addQuizToDB();
            quizManagerService.clearCurrentQuiz();
        }
        this.dialogRef.close(true);
    }
}
