import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ContextQuestionModal, StateAdmin, StateHeader, StateQuestionModal } from '@app/common-client/constant/state';
import { QuestionDisplayModalComponent } from '@app/components/admin/question-display-modal/question-display-modal.component';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { ImportQuizJsonService } from '@app/services/utils/Import/import-quiz-json.service';
import { QuestionType } from '@common/constant/state';
import { ExportedQCM, ExportedQRL } from '@common/interfaces/question';
import { ExportedQuiz, Quiz } from '@common/interfaces/quiz';
import { saveAs } from 'file-saver';
@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent {
    @ViewChild('myInput') fileInput: ElementRef;
    adminPageState = StateAdmin;
    currentStateHeader: StateHeader = StateHeader.ADMIN;
    currentStatePage: StateAdmin = StateAdmin.DEFAULT;
    isExportButtonDisabled: boolean = true;
    isImportButtonDisabled: boolean = true;
    importedFile: File;

    constructor(
        private dialog: MatDialog,
        private importQuizJsonService: ImportQuizJsonService,
        private quizManagerService: QuizManagerService,
    ) {}

    changeState(newState: StateAdmin): void {
        this.currentStatePage = newState;
        this.quizManagerService.clearCurrentQuiz();
        this.isExportButtonDisabled = true;
        this.isImportButtonDisabled = true;
    }

    onCurrentQuizUpdated(isTrue: boolean): void {
        this.isExportButtonDisabled = isTrue;
    }

    showModalAddQuestion(): void {
        this.dialog.open(QuestionDisplayModalComponent, {
            data: {
                question: { _id: '', text: '', type: '', points: 0, choices: [], date: new Date() },
                questionState: StateQuestionModal.NEW,
                questionContext: ContextQuestionModal.DEFAULT,
            },
        });
    }

    async importQuiz(): Promise<void> {
        this.quizManagerService.clearCurrentQuiz();
        if (await this.importQuizJsonService.isImportValid(this.importedFile)) {
            this.quizManagerService.addQuizToDB();
            this.quizManagerService.clearCurrentQuiz();
        }
        this.fileInput.nativeElement.value = '';
        this.isImportButtonDisabled = true;
        this.isExportButtonDisabled = true;
    }

    saveQuiz() {
        this.quizManagerService.saveQuizToDB();
    }

    onFileSelected(event: Event): void {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            this.importedFile = files[0];
            this.isImportButtonDisabled = false;
        }
    }

    exportQuizJson(quiz: Quiz): void {
        saveAs(new Blob([JSON.stringify(this.formattingQuizExport(quiz), null, 2)], { type: 'application/json' }));
    }

    formattingQuizExport(quiz: Quiz): ExportedQuiz {
        const quizToExport: ExportedQuiz = {
            id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            duration: quiz.duration,
            lastModification: quiz.lastModification,
            questions: [],
        };

        quiz.questions.forEach((question) => {
            if (question.type === QuestionType.QCM) {
                const qcmQuestion: ExportedQCM = {
                    text: question.text,
                    type: question.type,
                    points: question.points,
                    choices: [],
                };
                question.choices.forEach((answer) => {
                    qcmQuestion.choices.push({
                        text: answer.text,
                        isCorrect: answer.isCorrect,
                    });
                });
                quizToExport.questions.push(qcmQuestion);
            } else {
                const qrlQuestion: ExportedQRL = {
                    text: question.text,
                    type: question.type,
                    points: question.points,
                };
                quizToExport.questions.push(qrlQuestion);
            }
        });

        return quizToExport;
    }
}
