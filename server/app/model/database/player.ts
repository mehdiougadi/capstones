import { AnswerSubmit } from './answer-submit';

export class Player {
    id: string;
    name: string;
    points: number;
    bonusCount: number;
    answerResponse: AnswerSubmit;
    constructor(name: string, id: string) {
        this.id = id;
        this.name = name;
        this.answerResponse = new AnswerSubmit();
        this.points = 0;
        this.bonusCount = 0;
    }
}
