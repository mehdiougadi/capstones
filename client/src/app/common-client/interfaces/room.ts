import { Player } from '@common/classes/player';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Quiz } from '@common/interfaces/quiz';

export interface Room {
    id: string;
    quiz: Quiz;
    accessCode: string;

    questionStats: QuestionStats[];
    listPlayers: Player[];

    roundFinished: boolean;
    isLocked: boolean;
    isTesting: boolean;
    isPaused: boolean;

    currentTime: number;
    currentQuestionIndex: number;
    currentState: string;
}
