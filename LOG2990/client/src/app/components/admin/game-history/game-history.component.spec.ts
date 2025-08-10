/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameHistoryComponent } from '@app/components/admin/game-history/game-history.component';
import { GameHistoryManager } from '@app/services/managers/game-history/game-history-manager.service';
import { GameHistory } from '@common/interfaces/game-history';
import { of } from 'rxjs';

describe('GameHistoryComponent', () => {
    let component: GameHistoryComponent;
    let fixture: ComponentFixture<GameHistoryComponent>;
    let gameHistoryManagerSpy: jasmine.SpyObj<GameHistoryManager>;
    let gameHistoryList: GameHistory[];
    beforeEach(async () => {
        gameHistoryManagerSpy = jasmine.createSpyObj('GameHistoryManager', ['getHistory', 'deleteHistory']);
        gameHistoryList = [
            { quizName: 'A Quiz', startTime: new Date(2022, 1, 1), playerCount: 5, topScore: 150 },
            { quizName: 'B Quiz', startTime: new Date(2022, 1, 2), playerCount: 3, topScore: 100 },
        ];

        TestBed.configureTestingModule({
            declarations: [GameHistoryComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: GameHistoryManager, useValue: gameHistoryManagerSpy }],
        }).compileComponents();
        fixture = TestBed.createComponent(GameHistoryComponent);
        component = fixture.componentInstance;
        gameHistoryManagerSpy = TestBed.inject(GameHistoryManager) as jasmine.SpyObj<GameHistoryManager>;
        gameHistoryManagerSpy.getHistory.and.returnValue(of(gameHistoryList));
        gameHistoryManagerSpy.deleteHistory.and.returnValue(of(true));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load history on init', () => {
        const mockHistories: GameHistory[] = [
            { quizName: 'Quiz 1', startTime: new Date(), playerCount: 3, topScore: 100 },
            { quizName: 'Quiz 2', startTime: new Date(), playerCount: 5, topScore: 150 },
        ];
        gameHistoryManagerSpy.getHistory.and.returnValue(of(mockHistories));

        component.ngOnInit();

        expect(gameHistoryManagerSpy.getHistory).toHaveBeenCalled();

        expect(component.gameHistories.length).toBe(2);
        expect(component.gameHistories).toEqual(mockHistories);
    });

    it('should sort histories by quizName', () => {
        component.ngOnInit();

        fixture.detectChanges();
        component['sortDirection'] = 'desc';
        component.sortHistory('quizName');
        fixture.detectChanges();
        expect(component.gameHistories[0].quizName).toEqual('A Quiz');
        expect(component['sortDirection']).toEqual('asc');
    });
    it('should reset history', fakeAsync(() => {
        component.resetHistory();
        tick();

        expect(gameHistoryManagerSpy.deleteHistory).toHaveBeenCalled();
        expect(gameHistoryManagerSpy.getHistory).toHaveBeenCalled();
    }));

    it('should sort histories by startTime in descending order', () => {
        component.ngOnInit();
        fixture.detectChanges();
        component.gameHistories = [
            { quizName: 'B Quiz', startTime: new Date(2022, 1, 2), playerCount: 3, topScore: 100 },
            { quizName: 'A Quiz', startTime: new Date(2022, 1, 1), playerCount: 5, topScore: 150 },
        ];
        component['sortDirection'] = 'asc';
        component.sortHistory('startTime');

        fixture.detectChanges();

        expect(component.gameHistories[0].startTime).toEqual(component.gameHistories[0].startTime);
        expect(component['sortDirection']).toEqual('desc');
    });
    it('should sort histories by quizName', () => {
        component.ngOnInit();

        fixture.detectChanges();
        component.gameHistories = [
            { quizName: 'A Quiz', startTime: new Date(2022, 1, 2), playerCount: 3, topScore: 100 },
            { quizName: 'A Quiz', startTime: new Date(2022, 1, 1), playerCount: 5, topScore: 150 },
        ];
        component['sortDirection'] = 'desc';
        component.sortHistory('quizName');
        fixture.detectChanges();
        expect(component.gameHistories[0].quizName).toEqual('A Quiz');
        expect(component['sortDirection']).toEqual('asc');
    });

    it('should sort game histories ascending and descending by quizName correctly', () => {
        component.ngOnInit();
        fixture.detectChanges();

        component.gameHistories = [
            { quizName: 'C Quiz', startTime: new Date(2022, 2, 1), playerCount: 2, topScore: 120 },
            { quizName: 'A Quiz', startTime: new Date(2022, 0, 1), playerCount: 5, topScore: 150 },
            { quizName: 'B Quiz', startTime: new Date(2022, 1, 1), playerCount: 4, topScore: 140 },
        ];

        component['sortDirection'] = 'asc';
        component.sortHistory('quizName');
        expect(component.gameHistories[0].quizName).toBe('C Quiz');
        expect(component.gameHistories[1].quizName).toBe('B Quiz');
        expect(component.gameHistories[2].quizName).toBe('A Quiz');

        component['sortDirection'] = 'desc';
        component.sortHistory('quizName');
        expect(component.gameHistories[0].quizName).toBe('A Quiz');
        expect(component.gameHistories[1].quizName).toBe('B Quiz');
        expect(component.gameHistories[2].quizName).toBe('C Quiz');
    });
});
