export class Player {
    name: string;
    points: number = 0;
    answered: boolean = false;
    goodAnswers: boolean = false;
    firstToAnswer: boolean = false;
    isBannedFromChat: boolean = false;
    hasInteracted: boolean = false;
    bonusPoints: number = 0;
    pointFactor: number = 0;
    chosenAnswer: string[];
    qrlAnswer: string;
    interaction: string = 'red';
    constructor(name: string) {
        this.name = name;
    }
    addPoints(newPoints: number) {
        this.points += newPoints;
    }
}
