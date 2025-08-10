import { Question } from './question';
export interface Game {
    id: string;
    title: string;
    duration: number;
    description: string;
    lastModification?: string | null;
    questions: Question[];
    isVisible?: boolean;
}
