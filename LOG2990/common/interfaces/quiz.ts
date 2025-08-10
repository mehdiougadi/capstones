import { ExportedQCM, ExportedQRL, Question } from './question';

export interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: Question[];
    duration: number;
    visible: boolean;
    lastModification: Date;
}

export interface ExportedQuiz {
    id: string;
    title: string;
    description: string;
    duration: number;
    lastModification: Date;
    questions: (ExportedQRL | ExportedQCM)[];
}
