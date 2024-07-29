import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModalComponent } from '@app/components/admin/confirm-modal/confirm-modal.component';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { Quiz } from '@common/interfaces/quiz';

@Component({
    selector: 'app-list-quiz',
    templateUrl: './list-quiz.component.html',
    styleUrls: ['./list-quiz.component.scss'],
})
export class ListQuizComponent {
    @Output() currentQuizUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();
    constructor(
        private quizManagerService: QuizManagerService,
        private dialog: MatDialog,
    ) {}

    setCurrentQuiz(quiz: Quiz): void {
        this.currentQuizUpdated.emit(this.quizManagerService.setCurrentQuiz(quiz));
    }

    deleteQuiz(event: MouseEvent, quizToDelete: Quiz): void {
        event.stopPropagation();
        this.dialog.open(ConfirmModalComponent, {
            data: { quizToDelete },
        });
        this.currentQuizUpdated.emit(true);
    }

    toggleVisibilityQuiz(event: MouseEvent, quiz: Quiz): void {
        event.stopPropagation();
        quiz.visible = !quiz.visible;
        this.quizManagerService.modifyQuizFromDB(quiz);
    }
}
