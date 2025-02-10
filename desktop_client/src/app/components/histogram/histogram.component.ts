import { Component, Input } from '@angular/core';
import { INITIAL_COUNT, MAX_PERCENTAGE } from '@app/app.constants';
import { HistogramChoice } from '@app/interfaces/choice';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent {
    @Input() choices: HistogramChoice[];

    constructor() {
        this.choices = [];
    }
    getPercentage(count: number): number {
        if (count === INITIAL_COUNT) {
            return INITIAL_COUNT;
        }
        const totalSelections = this.choices.reduce((total, choice) => total + choice.selectedCount, 0);
        return (count / totalSelections) * MAX_PERCENTAGE;
    }
}
