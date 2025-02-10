export interface Choice {
    text: string;
    isCorrect: boolean;
    selected?: boolean;
}
export interface HistogramChoice {
    text: string;
    isCorrect: boolean;
    selected?: boolean;
    showCorrect?: boolean;
    selectedCount: number;
}
