export class AnswerSubmit {
    answerTime: number;
    answer: number[] | string;
    constructor() {
        this.answerTime = Infinity;
        this.answer = [];
    }
}
