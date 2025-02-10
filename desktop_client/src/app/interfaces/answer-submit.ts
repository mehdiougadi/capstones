export class AnswerSubmit {
    answerTime: number;
    answer: number[] | string;
    constructor(answerTime: number, answer: number[] | string) {
        this.answerTime = answerTime;
        this.answer = answer;
    }
}
