import { validate } from 'class-validator';
import { CreateHistoryDto } from './create-history.dto';

describe('CreateHistoryDto', () => {
    let createHistoryDto: CreateHistoryDto;

    beforeEach(() => {
        createHistoryDto = new CreateHistoryDto();
        createHistoryDto.quizName = 'Test Quiz';
        createHistoryDto.playerCount = 4;
        createHistoryDto.topScore = 100;
        createHistoryDto.startTime = new Date();
    });

    it('should be valid when all required properties are valid', async () => {
        const errors = await validate(createHistoryDto);
        expect(errors.length).toBe(0);
    });

    it('should be invalid when startTime is not a date', async () => {
        createHistoryDto.startTime = new Date('invalid date');
        const errors = await validate(createHistoryDto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.property === 'startTime')).toBe(true);
    });
});
