import { TestBed } from '@angular/core/testing';
import { PlayerState } from '@app/app.constants';
import { PlayerSortingService } from './player-sorting.service';

describe('PlayerSortingService', () => {
    let service: PlayerSortingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PlayerSortingService],
        });
        service = TestBed.inject(PlayerSortingService);
    });

    it('should sort players by name in ascending order', () => {
        const players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        service.sortPlayersByName(true, players);

        expect(players[0].name).toBe('Alice');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Zara');
    });

    it('should sort players by name in descending order', () => {
        const players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
        ];

        service.sortPlayersByName(false, players);

        expect(players[0].name).toBe('Zara');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Alice');
    });

    it('should sort players by points in ascending order', () => {
        const players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 30, state: PlayerState.NoInteraction, canChat: true },
        ];

        service.sortPlayersByPoints(true, players);

        expect(players[0].name).toBe('Alice');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Zara');
    });

    it('should sort players by points in descending order', () => {
        const players = [
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 30, state: PlayerState.NoInteraction, canChat: true },
        ];

        service.sortPlayersByPoints(false, players);

        expect(players[0].name).toBe('Zara');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Alice');
    });

    it('should sort players by state in ascending order', () => {
        const players = [
            { name: 'Alice', points: 30, state: PlayerState.Confirmation, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.FirstInteraction, canChat: true },
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
        ];
        service.sortPlayersByState(true, players);

        expect(players[0].name).toBe('Alice');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Zara');
    });

    it('should sort players by state in descending order', () => {
        const players = [
            { name: 'Alice', points: 30, state: PlayerState.Confirmation, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.FirstInteraction, canChat: true },
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
        ];
        service.sortPlayersByState(false, players);

        expect(players[0].name).toBe('Zara');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Alice');
    });

    it('should handle players with the same state while sorting', () => {
        const players = [
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
        ];
        service.sortPlayersByState(false, players);

        expect(players[0].name).toBe('Zara');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Alice');
    });
    it('should handle players with the same state while sorting', () => {
        const players = [
            { name: 'Alice', points: 30, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Bob', points: 40, state: PlayerState.NoInteraction, canChat: true },
            { name: 'Zara', points: 50, state: PlayerState.NoInteraction, canChat: true },
        ];
        service.sortPlayersByState(true, players);

        expect(players[0].name).toBe('Alice');
        expect(players[1].name).toBe('Bob');
        expect(players[2].name).toBe('Zara');
    });
});
