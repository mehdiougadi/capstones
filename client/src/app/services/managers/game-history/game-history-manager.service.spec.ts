import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GameHistory } from '@common/interfaces/game-history';
import { environment } from 'src/environments/environment';
import { GameHistoryManager } from './game-history-manager.service';

describe('GameHistoryManager', () => {
    let service: GameHistoryManager;
    let httpMock: HttpTestingController;
    let gameHistoryList: GameHistory[];
    beforeEach(() => {
        gameHistoryList = [
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            { quizName: 'A Quiz', startTime: new Date(2022, 1, 1), playerCount: 5, topScore: 150 },
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            { quizName: 'B Quiz', startTime: new Date(2022, 1, 2), playerCount: 3, topScore: 100 },
        ];
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameHistoryManager],
        });
        service = TestBed.inject(GameHistoryManager);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should fetch history data via GET method', () => {
        const url = `${environment.serverUrl}/history`;

        service.getHistory().subscribe((data) => {
            expect(data).toEqual(gameHistoryList);
        });

        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('GET');
        req.flush(gameHistoryList);
    });

    it('should delete history data via DELETE method', () => {
        const url = `${environment.serverUrl}/history/`;
        service.deleteHistory().subscribe();

        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });
});
