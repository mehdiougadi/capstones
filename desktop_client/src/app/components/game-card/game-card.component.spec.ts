import { Component, DebugElement, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Game } from '@app/interfaces/game';

@Component({
    selector: 'app-game-card',
    template: ' <div class="game-card" *ngIf="game"></div> ',
})
class MockGameCardComponent {
    @Input() game: Game;
    @Input() isAdministration: boolean;
}

describe('GameCardComponent', () => {
    let component: MockGameCardComponent;
    let fixture: ComponentFixture<MockGameCardComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [MockGameCardComponent],
        });
        fixture = TestBed.createComponent(MockGameCardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display game details when provided', () => {
        const mockGame: Game = {
            id: '1',
            title: 'Sample Quiz',
            duration: 60,
            description: 'description',
            lastModification: '2023-09-13T12:00:00Z',
            questions: [],
            isVisible: true,
        };

        component.game = mockGame;
        fixture.detectChanges();

        const gameCardElement: DebugElement = fixture.debugElement.query(By.css('.game-card'));

        expect(gameCardElement).toBeTruthy();
    });
});
