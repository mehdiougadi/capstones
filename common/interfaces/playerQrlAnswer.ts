export interface PlayerQrlAnswer {
    questionIndex: number;
    qrlAnswers: {
        [answer: string]: {
            factor: number;
        };
    };
}