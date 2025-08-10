import { QuestionType } from '@common/constant/state';
import { Answer } from './answer';

export interface Question {
    _id: string;
    text: string;
    type: QuestionType;
    points: number;
    choices: Answer[];
    date: Date;
}

export interface ExportedQRL {
    text: string;
    type: QuestionType;
    points: number;
}

export interface ExportedQCM extends ExportedQRL {
    choices: Answer[];
}
