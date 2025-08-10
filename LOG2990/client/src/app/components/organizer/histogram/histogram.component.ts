import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { BLUE, FIFTY_PERCENT, GRADE0, GREEN, HUNDRED_PERCENT, PERCENTAGE_MULTIPLIER, RED, WHITE, ZERO_PERCENT } from '@common/constant/constants';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit, OnChanges, OnDestroy {
    @Input() currentRoom: Room;
    @Input() index: number;
    @Input() isGameOver: boolean;
    @Input() isResultsPage: boolean;
    updatedStatsSubscription: Subscription;
    currentIndex: number = 0;

    constructor(private gameConnectionService: GameConnectionSocketService) {}

    ngOnInit(): void {
        if (!this.isResultsPage) {
            this.gameConnectionService.connectToStatsUpdate(this.currentRoom.id);
            this.updatedStatsSubscription = this.gameConnectionService.updatedStats$.subscribe((stats: QuestionStats[]) => {
                this.currentRoom.questionStats = stats;
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.index && !changes.index.firstChange) {
            this.currentIndex = changes.index.currentValue;
        }
    }
    getChoices(stats: { [choice: string]: { count: number } }): string[] {
        return Object.keys(stats);
    }

    getBarHeight(stats: { [choice: string]: { count: number } }, label: string): string {
        return (stats[label].count / Math.max(...Object.values(stats).map((choice) => choice.count))) * PERCENTAGE_MULTIPLIER + '%';
    }

    getQRLChangedBarHeight(modifiedCount: number, modification: number = 0): string {
        const maxResponses = Math.max(modifiedCount, modification);
        if (maxResponses === 0) {
            return GRADE0;
        } else {
            return ((modification / maxResponses) * PERCENTAGE_MULTIPLIER).toFixed(2) + '%';
        }
    }

    getBarCount(stats: { [choice: string]: { count: number } }, choice: string): number {
        return stats[choice].count;
    }

    getBarColor(stats: { [choice: string]: { isCorrect: boolean; count: number } }, choice: string): string {
        return stats[choice].isCorrect ? GREEN : RED;
    }

    getPercentageColorQRL(percentage: string): string {
        switch (percentage) {
            case ZERO_PERCENT:
                return RED;
            case FIFTY_PERCENT:
                return BLUE;
            case HUNDRED_PERCENT:
                return GREEN;
            default:
                return WHITE;
        }
    }

    getPercentageHeightQRL(statsQRL: { fiftyPercent: number; zeroPercent: number; hundredPercent: number }, percentage: number): string {
        const maxResponses = Math.max(statsQRL.zeroPercent, statsQRL.fiftyPercent, statsQRL.hundredPercent);
        return ((percentage / maxResponses) * PERCENTAGE_MULTIPLIER).toFixed(2) + '%';
    }

    getBarColorQRLChanged(statsQRL: { modifiedLastSeconds: number; notModifiedLastSeconds: number }, scoreKey: string): string {
        switch (scoreKey) {
            case 'modifiedLastSeconds':
                return BLUE;
            case 'notModifiedLastSeconds':
                return GREEN;
            default:
                return WHITE;
        }
    }

    getPercentagesCount(indexQuestion: number): { percentage: string; count: number }[] {
        const questionIndexFound = this.currentRoom.questionStats.find((q) => q.questionIndex === indexQuestion);
        if (questionIndexFound) {
            const { zeroPercent, fiftyPercent, hundredPercent } = questionIndexFound.statsQRL.scores;
            return [
                { percentage: ZERO_PERCENT, count: zeroPercent },
                { percentage: FIFTY_PERCENT, count: fiftyPercent },
                { percentage: HUNDRED_PERCENT, count: hundredPercent },
            ];
        } else {
            return [];
        }
    }

    next(): void {
        this.currentIndex = this.currentIndex < this.currentRoom.questionStats.length - 1 ? this.currentIndex + 1 : 0;
    }

    previous(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }

    truncateAnswer(text: string, maxLength: number): string {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }

    ngOnDestroy(): void {
        if (this.updatedStatsSubscription) {
            this.updatedStatsSubscription.unsubscribe();
        }
    }
}
