import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
    CONGRATULATION,
    INVALID,
    MAX_LENGTH_DESCRIPTION,
    MAX_LENGTH_INPUT,
    MAX_LENGTH_TEXT,
    MIN_LENGTH_INPUT,
    MIN_POINTS,
    QuestionType,
    Routes,
    SUCCESS_QUIZ_CREATION,
    SUCCESS_QUIZ_MODIFICATION,
} from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { QuestionForm } from '@app/interfaces/question';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-modify-game-page',
    templateUrl: './modify-game-page.component.html',
    styleUrls: ['./modify-game-page.component.scss'],
})
export class ModifyGamePageComponent implements OnInit {
    gameForm: FormGroup;
    isNewGame: boolean;
    gameId: string | null;
    elementToSend: { [key: string]: unknown };
    errorMessage: string;
    originalGameForm: { [key: string]: unknown; questions: QuestionForm[] };
    isRed: boolean;

    // Tout les paramètres sont nécessaire ici
    // eslint-disable-next-line max-params
    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private gameService: GameService,
        private router: Router,
        private readonly dialog: MatDialog,
    ) {
        this.gameForm = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_INPUT)]],
            duration: [0, [Validators.required, Validators.min(MIN_LENGTH_INPUT), Validators.max(MAX_LENGTH_INPUT)]],
            description: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_DESCRIPTION)]],
            questions: this.fb.array([this.initQuestion()]),
        });
        this.isRed = false;
        this.elementToSend = {};
        this.errorMessage = '';
    }

    get questions(): FormArray {
        return this.gameForm.get('questions') as FormArray;
    }

    ngOnInit(): void {
        this.getForm();
    }

    getShowDetails(index: number) {
        const question = this.getQuestionFormGroup(index);
        return question.controls.showDetails.value;
    }

    addQuestion(): void {
        const questionGroup = this.initQuestion();
        this.questions.push(questionGroup);
    }

    checkLength(length: number) {
        if (length > MAX_LENGTH_DESCRIPTION) {
            this.isRed = true;
        } else {
            this.isRed = false;
        }
    }

    onQuestionIndexChange(index: number) {
        this.questions.at(index).patchValue({ index });
    }

    onQuestionTypeChange(type: QuestionType, index: number) {
        this.questions.at(index).patchValue({ type });
        if (type === QuestionType.QRL) {
            (this.questions.at(index) as FormGroup).removeControl('choices');
        } else {
            (this.questions.at(index) as FormGroup).setControl('choices', this.initChoices());
        }
    }

    deleteQuestion(index: number): void {
        this.questions.removeAt(index);
    }

    getQuestionFormGroup(index: number): FormGroup {
        return this.questions.at(index) as FormGroup;
    }

    dragQuestion(event: CdkDragDrop<unknown[]>): void {
        moveItemInArray(this.questions.controls, event.previousIndex, event.currentIndex);
        this.questions.updateValueAndValidity();
    }

    onSubmit(): void {
        this.gameForm.markAllAsTouched();
        if (this.gameForm.valid) {
            if (this.isNewGame) {
                this.createGame();
            } else {
                this.modifyGame();
            }
        }
    }

    private initQuestion(): FormGroup {
        return this.fb.group({
            text: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_TEXT)]],
            points: [MIN_POINTS, Validators.required],
            type: QuestionType.QCM,
            choices: this.initChoices(),
            showDetails: [true],
            index: [INVALID],
        }) as FormGroup;
    }

    private initChoices(): FormArray {
        return this.fb.array(
            [
                this.fb.group({
                    text: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_INPUT)]],
                    isCorrect: [true],
                }),
                this.fb.group({
                    text: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_INPUT)]],
                    isCorrect: [false],
                }),
            ],
            this.atLeastOneTrueOrOneFalseValidator,
        );
    }

    private atLeastOneTrueOrOneFalseValidator(control: AbstractControl): ValidationErrors | null {
        const choices = control.value;
        if (choices.every((choice: { isCorrect: boolean }) => !choice.isCorrect)) {
            return { atLeastOneTrueOrOneFalse: true };
        } else if (choices.every((choice: { isCorrect: boolean }) => choice.isCorrect)) {
            return { atLeastOneTrueOrOneFalse: true };
        } else {
            return null;
        }
    }

    private getForm() {
        this.gameId = this.route.snapshot.paramMap.get('gameId');
        if (this.gameId) {
            this.modifyGameForm(this.gameId);
        } else {
            this.createNewGameForm();
        }
    }

    private createNewGameForm() {
        this.isNewGame = true;
        this.checkChangeForm();
    }

    private modifyGameForm(gameId: string) {
        this.isNewGame = false;
        this.gameService.getGameAdmin(gameId).subscribe({
            next: (game) => {
                const questionsArray: FormGroup[] = this.createQuestions(game.questions);
                this.gameForm = this.fb.group({
                    title: [game.title, [Validators.required, Validators.maxLength(MAX_LENGTH_TEXT)]],
                    description: [game.description, [Validators.required, Validators.maxLength(MAX_LENGTH_DESCRIPTION)]],
                    duration: [game.duration, [Validators.required, Validators.min(MIN_LENGTH_INPUT), Validators.max(MAX_LENGTH_INPUT)]],
                    questions: this.fb.array(questionsArray),
                });
                this.checkChangeForm();
            },
            error: () => {
                this.router.navigate([Routes.Home]);
            },
        });
    }

    private createQuestions(questions: QuestionForm[]): FormGroup[] {
        return questions.map((question, index) => {
            if (question.type === QuestionType.QCM) {
                const choicesArray: FormGroup[] = this.createChoice(question);
                return this.fb.group({
                    text: [question.text, Validators.required],
                    choices: this.fb.array(choicesArray, this.atLeastOneTrueOrOneFalseValidator),
                    points: [question.points, Validators.required],
                    showDetails: [false],
                    index: [index],
                    type: question.type,
                });
            }
            return this.fb.group({
                text: [question.text, Validators.required],
                points: [question.points, Validators.required],
                showDetails: [false],
                index: [index],
                type: question.type,
            });
        });
    }

    private createChoice(question: QuestionForm): FormGroup[] {
        return question.choices.map((choice) => {
            return this.fb.group({
                text: [choice.text, Validators.required],
                isCorrect: [choice.isCorrect],
            });
        });
    }

    private checkChangeForm(): void {
        this.originalGameForm = this.gameForm.value;
        this.originalGameForm.questions.forEach((question: QuestionForm) => {
            delete question.index;
            delete question.showDetails;
        });
        this.gameForm.valueChanges.subscribe((newValue) => {
            this.errorMessage = '';
            const newCopy = JSON.parse(JSON.stringify(newValue));
            newCopy['questions'].forEach((question: QuestionForm) => {
                delete question.showDetails;
                delete question.index;
            });
            for (const key in newCopy) {
                if (JSON.stringify(this.originalGameForm[key]) !== JSON.stringify(newCopy[key])) {
                    this.elementToSend[key] = newCopy[key];
                } else {
                    delete this.elementToSend[key];
                }
            }
        });
    }

    private modifyGame() {
        this.elementToSend['id'] = this.gameId;
        this.gameService.updateGame(this.gameId as string, this.elementToSend).subscribe({
            next: () => {
                this.dialog.open(ErrorPopupComponent, { data: { title: CONGRATULATION, message: SUCCESS_QUIZ_MODIFICATION } });
                this.router.navigate([Routes.Administration]);
            },
            error: (error) => {
                if (error.statusCode === HttpStatusCode.NotFound) {
                    const sender = JSON.parse(JSON.stringify(this.gameForm.value));
                    sender['questions'].forEach((question: QuestionForm) => {
                        delete question.showDetails;
                        delete question.index;
                    });
                    this.elementToSend = sender;
                    this.createGame();
                } else {
                    this.errorMessage = error.message;
                }
            },
        });
    }

    private createGame() {
        this.gameService.createGame(this.elementToSend).subscribe({
            next: () => {
                this.dialog.open(ErrorPopupComponent, { data: { title: CONGRATULATION, message: SUCCESS_QUIZ_CREATION } });
                this.router.navigate([Routes.Administration]);
            },
            error: (error) => {
                this.errorMessage = error.message;
            },
        });
    }
}
