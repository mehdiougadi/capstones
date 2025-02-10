import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { INVALID, MAXIMUM_POINTS_VALUE, MAX_LENGTH_INPUT, MINIMUM_POINTS_VALUE, QuestionType, STEP, Status } from '@app/app.constants';
import { QuestionForm } from '@app/interfaces/question';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-create-question',
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.scss'],
})
export class CreateQuestionComponent implements OnInit {
    @Input() index;
    @Input() questionForm: FormGroup;
    @Input() gameId: string | null;
    @Output() questionIndexChange;
    @Output() questionTypeChange;
    status: Status;
    statusEnum;
    errorType: string;
    isQcmSelected: boolean;

    constructor(
        private readonly fb: FormBuilder,
        private readonly gameService: GameService,
    ) {
        this.index = 0;
        this.status = Status.Start;
        this.statusEnum = Status;
        this.errorType = '';
        this.questionIndexChange = new EventEmitter<number>();
        this.questionTypeChange = new EventEmitter<QuestionType>();
    }

    get choices(): FormArray {
        return this.questionForm.get('choices') as FormArray;
    }

    get showDetails() {
        const showDetails = this.questionForm.get('showDetails') as FormGroup;
        return showDetails.value;
    }

    ngOnInit() {
        this.isQcmSelected = this.questionForm.value.type === QuestionType.QCM;
        this.questionForm.valueChanges.subscribe(() => {
            this.status = Status.Start;
        });
    }

    toggleDetails() {
        const showDetailsControl = this.questionForm.get('showDetails');
        if (showDetailsControl) {
            showDetailsControl.setValue(!showDetailsControl.value);
        }
    }

    addChoice(): void {
        this.choices.push(
            this.fb.group({
                text: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_INPUT)]],
                isCorrect: [false],
            }),
        );
    }

    deleteChoice(index: number): void {
        this.choices.removeAt(index);
    }

    selectOption(optionChosen: string): void {
        if (optionChosen === 'QRL') {
            this.choices.clear();
            this.choices.clearValidators();
            this.choices.updateValueAndValidity();
            this.questionTypeChange.emit(QuestionType.QRL);
            this.isQcmSelected = false;
        } else if (optionChosen === 'QCM') {
            this.questionTypeChange.emit(QuestionType.QCM);
            this.isQcmSelected = true;
        }
    }

    roundToNearestTen(): void {
        const pointsControl = this.questionForm.get('points');
        if (pointsControl) {
            let points = pointsControl.value;
            if (points > MAXIMUM_POINTS_VALUE) {
                points = MAXIMUM_POINTS_VALUE;
            }
            if (points < MINIMUM_POINTS_VALUE) {
                points = MINIMUM_POINTS_VALUE;
            }
            points = Math.round(points / STEP) * STEP;
            pointsControl.setValue(points);
        }
    }

    dragChoice(event: CdkDragDrop<unknown[]>): void {
        moveItemInArray(this.choices.controls, event.previousIndex, event.currentIndex);
        this.choices.updateValueAndValidity();
    }

    submitQuestion(): void {
        this.questionForm.markAllAsTouched();
        if (!this.questionForm.valid || !this.gameId) {
            return;
        } else {
            const senderQuestionForm: QuestionForm = JSON.parse(JSON.stringify(this.questionForm.value));
            delete senderQuestionForm.showDetails;
            delete senderQuestionForm.index;
            if (this.questionForm.value.index === INVALID) {
                this.createQuestion(senderQuestionForm);
            } else {
                this.updateQuestion(senderQuestionForm);
            }
        }
    }

    private createQuestion(senderQuestionForm: QuestionForm): void {
        this.gameService.createQuestion(this.gameId as string, senderQuestionForm).subscribe({
            next: () => {
                this.questionIndexChange.emit(this.index);
                this.status = Status.UpdateAccept;
                this.questionForm.markAsUntouched();
            },
            error: (error) => {
                this.status = Status.UpdateRefuse;
                this.errorType = error.message;
            },
        });
    }

    private updateQuestion(senderQuestionForm: QuestionForm): void {
        this.gameService.updateQuestion(this.gameId as string, this.questionForm.value.index, senderQuestionForm).subscribe({
            next: () => {
                this.status = Status.UpdateAccept;
                this.questionForm.markAsUntouched();
            },
            error: (error) => {
                this.status = Status.UpdateRefuse;
                this.errorType = error.message;
            },
        });
    }
}
