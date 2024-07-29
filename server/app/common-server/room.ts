import { Player } from '@common/classes/player';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Quiz } from '@common/interfaces/quiz';

export interface Room {
    id: string;
    quiz: Quiz;
    accessCode: string;

    questionStats: QuestionStats[];
    listPlayers: Player[];
    nameBanned: string[];

    roundFinished: boolean;
    isLocked: boolean;
    isTesting: boolean;
    isPaused: boolean;
    isPanicMode: boolean;
    lockPlayerPoints: boolean;

    dateCreated: Date;
    numberOfPlayers: number;
    bestScore: number;
    randomMode: boolean;

    currentTime: number;
    currentQuestionIndex: number;
    currentState: string;
    timer?: NodeJS.Timer;
}
