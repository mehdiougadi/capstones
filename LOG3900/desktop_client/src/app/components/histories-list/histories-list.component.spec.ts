/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmationDialogComponent } from '@app/components/confirmation-dialog/confirmation-dialog.component';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { History } from '@app/interfaces/history';
import { HistoryService } from '@app/services/history/history.service';
import { of, throwError } from 'rxjs';
import { HistoriesListComponent } from './histories-list.component';

describe('HistoriesListComponent', () => {
    let component: HistoriesListComponent;
    let fixture: ComponentFixture<HistoriesListComponent>;
    let historyServiceSpy: jasmine.SpyObj<HistoryService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getAllHistory', 'deleteAllHistories']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);

        TestBed.configureTestingModule({
            declarations: [HistoriesListComponent],
            providers: [
                { provide: HistoryService, useValue: historyServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
            imports: [MatIconModule],
        });

        fixture = TestBed.createComponent(HistoriesListComponent);
        component = fixture.componentInstance;
        component.histories = [
            { gameTitle: 'Game B', date: '2023-01-01', numberOfPlayers: 3, bestScore: 1500 },
            { gameTitle: 'Game A', date: '2023-02-15', numberOfPlayers: 2, bestScore: 1200 },
            { gameTitle: 'Game C', date: '2023-03-30', numberOfPlayers: 4, bestScore: 1800 },
        ];
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should call fetchHistories on initialization', () => {
            spyOn(component as any, 'fetchHistories');
            component.ngOnInit();
            expect((component as any).fetchHistories).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from historySubscription', () => {
            (component as any).historySubscription = { unsubscribe: jasmine.createSpy('unsubscribe') } as unknown;
            component.ngOnDestroy();
            expect(component.historySubscription.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('fetchHistories', () => {
        it('should fetch histories successfully', () => {
            const mockHistories: History[] = [
                {
                    gameTitle: 'Game 1',
                    date: '2023-01-01',
                    numberOfPlayers: 3,
                    bestScore: 1500,
                },
                {
                    gameTitle: 'Game 2',
                    date: '2023-02-15',
                    numberOfPlayers: 2,
                    bestScore: 1200,
                },
                {
                    gameTitle: 'Game 3',
                    date: '2023-03-30',
                    numberOfPlayers: 4,
                    bestScore: 1800,
                },
            ];
            historyServiceSpy.getAllHistory.and.returnValue(of(mockHistories));

            (component as any).fetchHistories();

            expect(component.histories).toEqual(mockHistories);
        });

        it('should handle error during fetchHistories', () => {
            const errorMessage = 'Test error message';
            historyServiceSpy.getAllHistory.and.returnValue(throwError(() => new Error(errorMessage)));

            spyOn(component as any, 'showErrorPopup');

            (component as any).fetchHistories();

            expect((component as any).showErrorPopup).toHaveBeenCalled();
        });
    });

    describe('deleteAllHistory', () => {
        it('should delete all histories when user confirms', () => {
            const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
            dialogSpy.open.and.returnValue(dialogRefSpyObj);
            historyServiceSpy.deleteAllHistories.and.returnValue(of(null));

            spyOn(component as any, 'fetchHistories');

            (component as any).deleteAllHistories();

            expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.any(Object));
            expect(historyServiceSpy.deleteAllHistories).toHaveBeenCalled();
            expect((component as any).fetchHistories).toHaveBeenCalled();
        });

        it('should show an error pop up if an error occurs', () => {
            const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
            dialogSpy.open.and.returnValue(dialogRefSpyObj);
            historyServiceSpy.deleteAllHistories.and.returnValue(throwError(() => 'WAKE UP'));

            spyOn(component as any, 'fetchHistories');
            const spyShowErrorPopup = spyOn(component as any, 'showErrorPopup');

            component.deleteAllHistories();

            expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.any(Object));
            expect(historyServiceSpy.deleteAllHistories).toHaveBeenCalled();
            expect((component as any).fetchHistories).not.toHaveBeenCalled();
            expect(spyShowErrorPopup).toHaveBeenCalled();
        });

        it('should not delete histories when user cancels', () => {
            const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false) });
            dialogSpy.open.and.returnValue(dialogRefSpyObj);

            spyOn(component as any, 'deleteAllHistories');

            (component as any).deleteAllHistories();

            expect(historyServiceSpy.deleteAllHistories).not.toHaveBeenCalled();
            expect(spyOn(component as any, 'fetchHistories')).not.toHaveBeenCalled();
        });
    });

    describe('showErrorPopup', () => {
        it('should open ErrorPopupComponent with the provided title and message', () => {
            const customTitle = 'Custom Title';
            const errorMessage = 'Test error message';

            (component as any).showErrorPopup(customTitle, errorMessage);

            expect(dialogSpy.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: customTitle, message: errorMessage } });
        });
    });

    describe('sortName', () => {
        it('should sort histories by name in ascending order', () => {
            component.sortedNameDESC = true;
            spyOn(component as any, 'sortHistoriesNameAsc');

            (component as any).sortName();

            expect((component as any).sortHistoriesNameAsc).toHaveBeenCalled();
        });

        it('should sort histories by name in descending order', () => {
            component.sortedNameASC = true;
            spyOn(component as any, 'sortHistoriesNameDesc');

            (component as any).sortName();

            expect((component as any).sortHistoriesNameDesc).toHaveBeenCalled();
        });
    });

    describe('sortDate', () => {
        it('should sort histories by date in ascending order', () => {
            component.sortedDateDESC = true;
            spyOn(component as any, 'sortHistoriesDateAsc');

            (component as any).sortDate();

            expect((component as any).sortHistoriesDateAsc).toHaveBeenCalled();
        });

        it('should sort histories by date in descending order', () => {
            component.sortedDateASC = true;
            spyOn(component as any, 'sortHistoriesDateDesc');

            (component as any).sortDate();

            expect((component as any).sortHistoriesDateDesc).toHaveBeenCalled();
        });
    });

    it('should set sorting flags correctly', () => {
        const flags = { nameAsc: true, nameDesc: false, dateAsc: false, dateDesc: true };

        (component as any).setSortingFlags(flags);

        expect(component.sortedNameASC).toBe(true);
        expect(component.sortedNameDESC).toBe(false);
        expect(component.sortedDateASC).toBe(false);
        expect(component.sortedDateDESC).toBe(true);
    });

    it('should sort histories by name in ascending order', () => {
        (component as any).sortHistoriesNameAsc();

        expect(component.histories[0].gameTitle).toBe('Game A');
        expect(component.histories[1].gameTitle).toBe('Game B');
        expect(component.histories[2].gameTitle).toBe('Game C');
    });

    it('should sort histories by name in descending order', () => {
        (component as any).sortHistoriesNameDesc();

        expect(component.histories[0].gameTitle).toBe('Game C');
        expect(component.histories[1].gameTitle).toBe('Game B');
        expect(component.histories[2].gameTitle).toBe('Game A');
    });

    it('should sort histories by date in ascending order', () => {
        component.histories.push({ gameTitle: 'Game D', date: '2023-02-15', numberOfPlayers: 1, bestScore: 1100 });

        (component as any).sortHistoriesDateAsc();

        expect(component.histories[0].gameTitle).toBe('Game B');
        expect(component.histories[1].gameTitle).toBe('Game D');
        expect(component.histories[2].gameTitle).toBe('Game A');
        expect(component.histories[3].gameTitle).toBe('Game C');
    });

    it('should sort histories by date in descending order', () => {
        component.histories.push({ gameTitle: 'Game D', date: '2023-02-15', numberOfPlayers: 1, bestScore: 1100 });

        (component as any).sortHistoriesDateDesc();

        expect(component.histories[0].gameTitle).toBe('Game C');
        expect(component.histories[1].gameTitle).toBe('Game A');
        expect(component.histories[2].gameTitle).toBe('Game D');
        expect(component.histories[3].gameTitle).toBe('Game B');
    });

    it('should sort histories by date in ascending order', () => {
        (component as any).sortHistoriesDateAsc();

        expect(component.histories[0].date).toBe('2023-01-01');
        expect(component.histories[1].date).toBe('2023-02-15');
        expect(component.histories[2].date).toBe('2023-03-30');
    });

    it('should sort histories by date in descending order', () => {
        (component as any).sortHistoriesDateDesc();

        expect(component.histories[0].date).toBe('2023-03-30');
        expect(component.histories[1].date).toBe('2023-02-15');
        expect(component.histories[2].date).toBe('2023-01-01');
    });

    it('closePopUp should call close pop up', () => {
        component.closePopup();

        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });
});
