import { TestBed } from '@angular/core/testing';
import { GameValidationService } from './game-validation.service';

describe('GameValidationService', () => {
    let gameValidationService: GameValidationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GameValidationService],
        });

        gameValidationService = TestBed.inject(GameValidationService);
    });

    it('should be created', () => {
        expect(gameValidationService).toBeTruthy();
    });

    it('should return valid result for a valid game object', () => {
        const validGame = {
            id: '1',
            title: 'Sample Quiz',
            duration: 60,
            lastModification: '2023-10-01T12:00:00Z',
            questions: [
                {
                    type: 'QCM',
                    text: 'Sample Question',
                    points: 10,
                    choices: [
                        {
                            text: 'Choice 1',
                            isCorrect: true,
                        },
                        {
                            text: 'Choice 2',
                            isCorrect: false,
                        },
                    ],
                },
            ],
        };

        const validationResult = gameValidationService.validateGame(validGame);
        expect(validationResult.valid).toBe(true);
        expect(validationResult.errors.length).toBe(0);
    });

    it('should return invalid result for an invalid game object', () => {
        const invalidGame = {
            id: '1',
            duration: 60,
        };

        const validationResult = gameValidationService.validateGame(invalidGame);
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
    });
});
