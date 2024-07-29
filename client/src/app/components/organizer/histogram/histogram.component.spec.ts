/* eslint-disable @typescript-eslint/no-magic-numbers */
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Room } from '@app/common-client/interfaces/room';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { FIFTY_PERCENT, HUNDRED_PERCENT, MAX_CHOICE_HISTOGRAM_LENTH, PERCENTAGE_MULTIPLIER, ZERO_PERCENT } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Quiz } from '@common/interfaces/quiz';
import { of } from 'rxjs';
import { HistogramComponent } from './histogram.component';

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let mockGameConnectionSocketService: jasmine.SpyObj<GameConnectionSocketService>;

    const mockQuestionStats: QuestionStats[] = [
        {
            questionIndex: 1,
            questionType: 'QCM',
            stats: {
                ['choiceA']: { count: 10, isCorrect: true },
                ['choiceB']: { count: 5, isCorrect: false },
            },
            statsQRL: {
                modifiedLastSeconds: 0,
                notModifiedLastSeconds: 0,
                scores: {
                    zeroPercent: 8,
                    fiftyPercent: 0,
                    hundredPercent: 0,
                },
            },
        },
        {
            questionIndex: 2,
            questionType: 'QCM',
            stats: {
                ['choiceC']: { count: 8, isCorrect: true },
                ['choiceD']: { count: 7, isCorrect: false },
            },
            statsQRL: {
                modifiedLastSeconds: 0,
                notModifiedLastSeconds: 0,
                scores: {
                    zeroPercent: 0,
                    fiftyPercent: 0,
                    hundredPercent: 0,
                },
            },
        },
    ];

    const mockRoom: Room = {
        id: 'mockRoomId',
        quiz: {} as Quiz,
        isLocked: false,
        accessCode: 'mockAccessCode',
        listPlayers: [],
        questionStats: mockQuestionStats,
        currentTime: 0,
        currentQuestionIndex: 0,
        roundFinished: false,
        isPaused: false,
        isTesting: false,
        currentState: GameState.END_ROUND,
    };

    beforeEach(() => {
        mockGameConnectionSocketService = jasmine.createSpyObj('GameConnectionSocketService', ['connectToStatsUpdate']);
        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            providers: [{ provide: GameConnectionSocketService, useValue: mockGameConnectionSocketService }],
        });
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        component.currentRoom = mockRoom;

        const mockStatsArray: QuestionStats[] = mockQuestionStats;
        mockGameConnectionSocketService.updatedStats$ = of(mockStatsArray);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate bar height correctly', () => {
        const barHeight = component.getBarHeight(mockQuestionStats[0].stats, 'choiceA');
        const expectedHeight =
            (mockQuestionStats[0].stats['choiceA'].count / Math.max(...Object.values(mockQuestionStats[0].stats).map((choice) => choice.count))) *
                PERCENTAGE_MULTIPLIER +
            '%';
        expect(barHeight).toBe(expectedHeight);
    });

    it('should get bar count correctly', () => {
        const barCount = component.getBarCount(mockQuestionStats[0].stats, 'choiceA');
        expect(barCount).toBe(10);
    });

    it('should get bar color correctly for correct choice', () => {
        const barColor = component.getBarColor(mockQuestionStats[0].stats, 'choiceA');
        expect(barColor).toBe('green');
    });

    it('should get bar color correctly for incorrect choice', () => {
        const barColor = component.getBarColor(mockQuestionStats[0].stats, 'choiceB');
        expect(barColor).toBe('red');
    });

    it('should reset currentIndex to 0 when reaching the end', () => {
        component.currentIndex = component.currentRoom.questionStats.length - 1;
        component.next();
        expect(component.currentIndex).toBe(0);
    });

    it('should increment currentIndex when next is called and currentIndex is less than questionStats length - 1', () => {
        component.currentIndex = 0;
        component.next();
        expect(component.currentIndex).toBe(1);
    });

    it('should decrement currentIndex when previous is called', () => {
        component.currentIndex = 1;
        component.previous();
        expect(component.currentIndex).toBe(0);
    });

    it('should handle previous method when currentIndex is 0', () => {
        component.currentIndex = 0;
        component.previous();
        expect(component.currentIndex).toBe(0);
    });

    it('should unsubscribe from subscription on destroy', () => {
        spyOn(component.updatedStatsSubscription, 'unsubscribe');
        component.ngOnDestroy();
        expect(component.updatedStatsSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should update currentIndex when index input changes', () => {
        const changes = {
            index: new SimpleChange(0, 1, false),
        };
        component.ngOnChanges(changes);
        expect(component.currentIndex).toBe(1);
    });

    it('should return "0%" when only modifiedCount is provided', () => {
        const modifiedCount = 5;
        const barHeight = component.getQRLChangedBarHeight(modifiedCount);
        expect(barHeight).toBe('0.00%');
    });

    it('should not truncate answer if it is less than or equal to MAX_CHOICE_HISTOGRAM_LENTH characters', () => {
        const maxLength = MAX_CHOICE_HISTOGRAM_LENTH;
        const shortText = 'hell';
        const equalLengthText = 'log2990Class';
        const truncatedText = 'log2...';
        const truncatedShortText = component.truncateAnswer(shortText, maxLength);
        const truncatedEqualLengthText = component.truncateAnswer(equalLengthText, maxLength);
        expect(truncatedShortText).toBe(shortText);
        expect(truncatedEqualLengthText).toBe(truncatedText);
    });

    it('should calculate percentage height correctly for QRL', () => {
        const statsQRL = { fiftyPercent: 5, zeroPercent: 8, hundredPercent: 10 };
        const percentage = 5;
        const percentageHeight = component.getPercentageHeightQRL(statsQRL, percentage);
        const expectedHeight =
            ((percentage / Math.max(statsQRL.zeroPercent, statsQRL.fiftyPercent, statsQRL.hundredPercent)) * PERCENTAGE_MULTIPLIER).toFixed(2) + '%';
        expect(percentageHeight).toBe(expectedHeight);
    });

    it('should get percentage color correctly for zero percent', () => {
        const color = component.getPercentageColorQRL(ZERO_PERCENT);
        expect(color).toBe('red');
    });

    it('should return "0%" if maxResponses is 0', () => {
        const modifiedCount = 0;
        const modification = 0;
        const barHeight = component.getQRLChangedBarHeight(modifiedCount, modification);
        expect(barHeight).toBe('0%');
    });

    it('should calculate the correct percentage height when maxResponses is not 0', () => {
        const modifiedCount = 5;
        const modification = 2;
        const expectedHeight = ((modification / modifiedCount) * PERCENTAGE_MULTIPLIER).toFixed(2) + '%';
        const barHeight = component.getQRLChangedBarHeight(modifiedCount, modification);
        expect(barHeight).toBe(expectedHeight);
    });

    it('should return "white" for unknown percentages', () => {
        const percentage = 'unknown';
        const color = component.getPercentageColorQRL(percentage);
        expect(color).toBe('white');
    });

    it('should get percentage color correctly for fifty percent', () => {
        const color = component.getPercentageColorQRL(FIFTY_PERCENT);
        expect(color).toBe('blue');
    });

    it('should get percentage color correctly for hundred percent', () => {
        const color = component.getPercentageColorQRL(HUNDRED_PERCENT);
        expect(color).toBe('green');
    });

    it('should get bar color to white by default', () => {
        const statsQRL = { modifiedLastSeconds: 0, notModifiedLastSeconds: 0 };
        const color = component.getBarColorQRLChanged(statsQRL, 'unknown');
        expect(color).toBe('white');
    });

    it('should get bar color correctly for modifiedLastSeconds', () => {
        const statsQRL = { modifiedLastSeconds: 5, notModifiedLastSeconds: 10 };
        const color = component.getBarColorQRLChanged(statsQRL, 'modifiedLastSeconds');
        expect(color).toBe('blue');
    });

    it('should get bar color correctly for notModifiedLastSeconds', () => {
        const statsQRL = { modifiedLastSeconds: 5, notModifiedLastSeconds: 10 };
        const color = component.getBarColorQRLChanged(statsQRL, 'notModifiedLastSeconds');
        expect(color).toBe('green');
    });

    it('should return an empty array if question index not found', () => {
        const percentages = component.getPercentagesCount(3);
        expect(percentages.length).toBe(0);
    });

    it('should return an array with correct counts if question index found', () => {
        const percentages = component.getPercentagesCount(1);
        expect(percentages.length).toBe(3);
        expect(percentages[0].count).toBe(8);
        expect(percentages[1].count).toBe(0);
        expect(percentages[2].count).toBe(0);
    });
});
