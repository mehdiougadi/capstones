export interface QuestionStats {
    questionIndex: number;
    questionType: 'QCM' | 'QRL';
    stats: {
        [choice: string]: {
            count: number;
            isCorrect: boolean;
        };
    };
    statsQRL: {
        modifiedLastSeconds: number;
        notModifiedLastSeconds: number;
        scores: {
            zeroPercent: number;
            fiftyPercent: number;
            hundredPercent: number;
        };
    };
}
