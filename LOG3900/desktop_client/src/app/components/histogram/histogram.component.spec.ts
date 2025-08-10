// utilisation de constante pour tester les fonctions
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistogramComponent } from './histogram.component';

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
        });
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should have default choices array', () => {
        expect(component.choices).toEqual([]);
    });

    it('should calculate percentage correctly', () => {
        component.choices = [
            { text: 'Novak Djokovic', isCorrect: true, selected: true, selectedCount: 3 },
            { text: 'Rafael Nadal', isCorrect: false, selected: false, selectedCount: 3 },
            { text: 'Roger Federer', isCorrect: false, selected: true, selectedCount: 4 },
        ];
        expect(component.getPercentage(0)).toBe(0);
        expect(component.getPercentage(3)).toBe(30);
        expect(component.getPercentage(2)).toBe(20);
    });
});
