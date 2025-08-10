/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HttpErrorResponse } from '@angular/common/http';
import { API_URL_HISTORY } from '@app/app.constants';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
    let historyService: HistoryService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [HistoryService],
        });

        historyService = TestBed.inject(HistoryService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(historyService).toBeTruthy();
    });

    it('should add history', () => {
        const mockHistory = {};

        historyService.addHistory(mockHistory).subscribe();

        const req = httpTestingController.expectOne(`${API_URL_HISTORY}/`);
        expect(req.request.method).toEqual('POST');
        req.flush(mockHistory);
    });

    it('should get all history', () => {
        const mockHistoryList = [
            {
                gameTitle: 'First Game',
                date: '2023-11-15T10:30:00.000Z',
                numberOfPlayers: 5,
                bestScore: 95,
            },
            {
                gameTitle: 'Second Game',
                date: '2023-11-16T12:45:00.000Z',
                numberOfPlayers: 8,
                bestScore: 87,
            },
            {
                gameTitle: 'Third Game',
                date: '2023-11-17T15:15:00.000Z',
                numberOfPlayers: 3,
                bestScore: 92,
            },
        ];

        historyService.getAllHistory().subscribe((historyList) => {
            expect(historyList).toEqual(mockHistoryList);
        });

        const req = httpTestingController.expectOne(`${API_URL_HISTORY}/`);
        expect(req.request.method).toEqual('GET');
        req.flush(mockHistoryList);
    });

    it('should delete all histories', () => {
        historyService.deleteAllHistories().subscribe();

        const req = httpTestingController.expectOne(`${API_URL_HISTORY}/`);
        expect(req.request.method).toEqual('DELETE');
        req.flush({});
    });

    it('should handle HttpErrorResponse correctly', () => {
        const errorResponse = new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            error: 'test-error',
        });

        historyService.getAllHistory().subscribe({
            next: () => fail('should have failed with 404 error'),
            error: (error) => {
                expect(error).toBe('test-error');
            },
        });

        const req = httpTestingController.expectOne(`${API_URL_HISTORY}/`);
        expect(req.request.method).toEqual('GET');
        req.flush('test-error', errorResponse);
    });
});
