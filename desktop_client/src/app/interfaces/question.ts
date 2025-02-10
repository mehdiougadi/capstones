import { QuestionType } from '@app/app.constants';
import { Choice } from './choice';

export interface Question {
    text: string;
    choices: Choice[];
    points: number;
    type: QuestionType;
}

export interface QuestionForm {
    text: string;
    choices: Choice[];
    points: number;
    index?: number;
    showDetails?: boolean;
    type: QuestionType;
}
