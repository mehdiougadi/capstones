/* eslint-disable prettier/prettier */
/* eslint-disable no-invalid-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL_GAME, QuestionType } from '@app/app.constants';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { GameService } from '@app/services/game/game.service';
import { of, throwError } from 'rxjs';
import { FileService } from './file.service';

describe('FileService', () => {
    let fileService: FileService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FileService, GameValidationService, GameService],
        });

        fileService = TestBed.inject(FileService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(fileService).toBeTruthy();
    });

    it('should export a game', () => {
        const gameId = '123';
        const mockBlob = new Blob();

        fileService.exportGame(gameId).subscribe((resultBlob) => {
            expect(resultBlob).toEqual(mockBlob);
        });

        const req = httpTestingController.expectOne(`${API_URL_GAME}/export/${gameId}`);
        expect(req.request.method).toBe('POST');

        req.flush(mockBlob);
    });

    it('should import a game successfully', async () => {
        const mockFileContents = JSON.stringify({
            id: '1',
            title: 'Game 1',
            duration: 5,
            description: 'Description 1',
            lastModification: new Date().toISOString(),
            questions: [
                {
                    text: 'Sample Question 1',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: 'QCM',
                },
                {
                    text: 'Sample Question 2',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: 'QCM',
                },
            ],
            isVisible: true,
        });
        const mockBlob = new Blob([mockFileContents]);

        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        const customFileList = {
            // sert pour tester les fichiers
            // eslint-disable-next-line @typescript-eslint/naming-convention
            0: new File([mockBlob], 'mock-game-file.json'),
            length: 1,
            item: (index: number) => (index === 0 ? this?.[0] : null),
        };
        Object.setPrototypeOf(customFileList, FileList.prototype);

        Object.defineProperty(inputElement, 'files', {
            value: customFileList,
            writable: false,
        });

        const validateGameSpy = spyOn((fileService as any).gameValidationService, 'validateGame').and.returnValue({ valid: true, errors: [] });
        const createGameSpy = spyOn((fileService as any).gameService, 'createGame').and.returnValue(of({}));

        const result = await fileService.importGame(inputElement);

        expect(validateGameSpy).toHaveBeenCalled();
        expect(createGameSpy).toHaveBeenCalled();

        expect(result).toBe('Done');
    });

    it('should handle import with invalid data', async () => {
        const mockFileContents = JSON.stringify({
            duration: 5,
            description: 'Description 1',
            lastModification: new Date().toISOString(),
            questions: [
                {
                    text: 'Sample Question 1',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: 'QCM',
                },
                {
                    text: 'Sample Question 2',
                    choices: [
                        {
                            text: 'Choice A',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice B',
                            isCorrect: false,
                        },
                    ],
                    points: 10,
                    type: 'QCM',
                },
            ],
            isVisible: true,
        });
        const mockBlob = new Blob([mockFileContents]);

        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        const customFileList = {
            // sert pour tester les fichiers
            // eslint-disable-next-line @typescript-eslint/naming-convention
            0: new File([mockBlob], 'mock-game-file.json'),
            length: 1,
            item: (index: number) => (index === 0 ? this?.[0] : null),
        };
        Object.setPrototypeOf(customFileList, FileList.prototype);

        Object.defineProperty(inputElement, 'files', {
            value: customFileList,
            writable: false,
        });

        const result = await fileService.importGame(inputElement);

        expect(result).toBe('La propriété suivante est requise: "id"\nLa propriété suivante est requise: "title"');
    });

    it('should handle import with missing file', async () => {
        const inputElement = document.createElement('input');
        inputElement.type = 'file';

        const result = await fileService.importGame(inputElement);

        expect(result).toBe('SystemError');
    });

    it('should retry with a new title on Forbidden error', async () => {
        const createGameSpy = spyOn((fileService as any).gameService, 'createGame');
        createGameSpy.and.returnValues(
            of({}),
            throwError(() => HttpStatusCode.Forbidden),
            of({}),
        );

        const promptSpy = spyOn(window, 'prompt');
        promptSpy.and.returnValue('New Game Title');

        await (fileService as any).retryWithNewTitle(gameData, (result: any) => {
            expect(promptSpy).toHaveBeenCalled();

            expect(createGameSpy).toHaveBeenCalledTimes(1);

            expect(result).toBe('Done');
        });
    });

    it('should handle cancellation of new title prompt', async () => {
        spyOn(window, 'prompt').and.returnValue(null);
        const result = await fileService['promptForNewTitleAndRetry'](gameData);
        expect(result).toBeNull();
    });

    const gameData = {
        id: '1',
        title: 'Game 1',
        duration: 5,
        description: 'Description 1',
        lastModification: new Date().toISOString(),
        questions: [
            {
                text: 'Sample Question 1',
                choices: [
                    {
                        text: 'Choice A',
                        isCorrect: true,
                    },
                    {
                        text: 'Choice B',
                        isCorrect: false,
                    },
                ],
                points: 10,
                type: QuestionType.QCM,
            },
            {
                text: 'Sample Question 2',
                choices: [
                    {
                        text: 'Choice A',
                        isCorrect: true,
                    },
                    {
                        text: 'Choice B',
                        isCorrect: false,
                    },
                ],
                points: 10,
                type: QuestionType.QCM,
            },
        ],
        isVisible: true,
    };
});
