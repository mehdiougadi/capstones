export class Points {
    name: string;
    points: number;
    hasBonus?: boolean;
    constructor(name: string, points: number, hasBonus?: boolean) {
        this.name = name;
        this.points = points;
        this.hasBonus = hasBonus;
    }
}
