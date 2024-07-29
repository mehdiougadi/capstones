import { Component, OnInit } from '@angular/core';
import { GameHistoryManager } from '@app/services/managers/game-history/game-history-manager.service';
import { LOWER_BOUND } from '@common/constant/constants';
import { GameHistory } from '@common/interfaces/game-history';

@Component({
    selector: 'app-game-history',
    templateUrl: './game-history.component.html',
    styleUrls: ['./game-history.component.scss'],
})
export class GameHistoryComponent implements OnInit {
    gameHistories: GameHistory[] = [];
    private sortDirection: 'asc' | 'desc' = 'asc';

    constructor(private readonly gameHistoryManager: GameHistoryManager) {}

    ngOnInit(): void {
        this.loadHistory();
    }

    sortHistory(property: keyof GameHistory): void {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.gameHistories = this.gameHistories.sort((a, b) => {
            const valueA = this.f(a[property]);
            const valueB = this.f(b[property]);
            if (valueA < valueB) {
                return this.sortDirection === 'asc' ? LOWER_BOUND : 1;
            } else if (valueA > valueB) {
                return this.sortDirection === 'asc' ? 1 : LOWER_BOUND;
            }
            return 0;
        });
    }

    f(a: unknown): number {
        if (a instanceof Date) {
            return a.getTime();
        }
        return a as number;
    }

    resetHistory(): void {
        this.gameHistoryManager.deleteHistory().subscribe(() => {
            this.loadHistory();
        });
    }

    private loadHistory(): void {
        this.gameHistoryManager.getHistory().subscribe((histories: GameHistory[]) => {
            this.gameHistories = histories;
        });
    }
}
