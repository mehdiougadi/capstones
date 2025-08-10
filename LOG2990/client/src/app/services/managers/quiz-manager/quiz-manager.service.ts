import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdGeneratorService } from '@app/services/utils/id-generator/id-generator.service';
import { QuizValidationService } from '@app/services/utils/quiz-validation/quiz-validation.service';
import { QuizMessage } from '@common/client-message/quiz-pop-up';
import { Question } from '@common/interfaces/question';
import { Quiz } from '@common/interfaces/quiz';
import { MessageDialogComponent } from 'src/app/components/general/message-dialog/message-dialog.component';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class QuizManagerService {
    currentQuiz: Quiz;
    quizList: Quiz[];
    visibleQuiz: Quiz[];
    private readonly baseUrlForQuiz: string = environment.serverUrl + '/quiz';

    // eslint-disable-next-line max-params
    constructor(
        private readonly http: HttpClient,
        private idGeneratorService: IdGeneratorService,
        private readonly dialog: MatDialog,
        private readonly quizValidationService: QuizValidationService,
    ) {
        this.currentQuiz = { _id: '', title: '', description: '', questions: [], duration: 0, visible: true, lastModification: new Date() };
        this.updateQuizList();
    }

    updateQuizList(): void {
        this.http.get<Quiz[]>(this.baseUrlForQuiz).subscribe((updatedList: Quiz[]) => {
            this.quizList = updatedList;
            this.visibleQuiz = updatedList.filter((quiz) => quiz.visible);
        });
    }

    saveQuizToDB(): void {
        if (this.currentQuiz._id !== '') {
            this.updateQuizList();
            if (this.quizList.some((quiz) => quiz._id === this.currentQuiz._id)) {
                this.modifyQuizFromDB(this.currentQuiz);
                return;
            }
        }
        this.addQuizToDB();
    }

    addQuizToDB(): void {
        if (this.verifyQuiz()) {
            this.currentQuiz.lastModification = new Date();
            this.currentQuiz.visible = false;
            this.currentQuiz._id = this.idGeneratorService.generateId();
            this.http.post<string>(this.baseUrlForQuiz, { ...this.currentQuiz }).subscribe({
                next: () => {
                    this.dialog.open(MessageDialogComponent, {
                        data: { message: QuizMessage.CREATE_QUIZ_SUCCESS },
                    });
                    this.updateQuizList();
                    this.clearCurrentQuiz();
                },
            });
        }
    }

    modifyQuizFromDB(quiz: Quiz): void {
        this.currentQuiz = quiz;
        if (this.verifyQuiz()) {
            quiz.lastModification = new Date();
            this.http.put<Quiz>(`${this.baseUrlForQuiz}/${quiz._id}`, { ...quiz }).subscribe({
                next: () => {
                    this.dialog.open(MessageDialogComponent, {
                        data: { message: QuizMessage.MODIFY_QUIZ_SUCCESS },
                    });
                    this.updateQuizList();
                },
            });
        }
    }

    deleteQuizFromDB(quizToDelete: Quiz): void {
        this.http.delete(`${this.baseUrlForQuiz}/${quizToDelete._id}`).subscribe({
            next: () => {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: QuizMessage.DELETE_QUIZ_SUCCESS },
                });
                this.updateQuizList();
            },
            error: () => {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: QuizMessage.DELETE_QUIZ_FAIL },
                });
                this.updateQuizList();
            },
        });
        this.currentQuiz._id = '';
    }

    addQuestionToQuiz(question: Question): void {
        question._id = this.idGeneratorService.generateId();
        this.currentQuiz.questions.push(question);
    }

    modifyQuestionFromQuiz(modifiedQuestion: Question): void {
        const index = this.currentQuiz.questions.findIndex((q) => q._id === modifiedQuestion._id);
        if (index >= 0) {
            this.currentQuiz.questions[index] = modifiedQuestion;
        }
    }

    deleteQuestionFromQuiz(questionToDelete: Question): void {
        this.currentQuiz.questions = this.currentQuiz.questions.filter((q) => {
            return q._id !== questionToDelete._id;
        });
    }

    clearCurrentQuiz(): void {
        this.currentQuiz = {
            _id: '',
            title: '',
            description: '',
            questions: [],
            duration: 0,
            visible: true,
            lastModification: new Date(),
        };
    }

    verifyQuiz(): boolean {
        return (
            this.quizValidationService.isQuizValid(this.currentQuiz, this.quizList) &&
            this.quizValidationService.isDuplicateTitle(this.currentQuiz, this.quizList)
        );
    }
    setCurrentQuiz(quiz: Quiz): boolean {
        this.updateQuizList();
        if (this.currentQuiz._id === quiz._id) {
            this.clearCurrentQuiz();
            return true;
        } else {
            this.currentQuiz = quiz;
            return false;
        }
    }
}
