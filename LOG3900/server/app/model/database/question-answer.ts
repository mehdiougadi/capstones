import { QuestionType } from '@app/app.constants';
import { ChoiceAnswer } from './answer-choice';

export class QuestionAnswer {
    choices?: ChoiceAnswer[];
    points: number;
    text: string;
    type: QuestionType;

    constructor() {
        this.choices = [];
        this.points = 0;
        this.text = '';
        this.type = QuestionType.QCM;
    }
}
