import { TestBed } from '@angular/core/testing';
import { IdGeneratorService } from './id-generator.service';

describe('IdGeneratorService', () => {
    let service: IdGeneratorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IdGeneratorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('generateId should return a non-empty string', () => {
        const id = service.generateId();
        expect(typeof id).toBe('string');
        expect(id).not.toBe('');
    });

    it('generateId should return a UUID-formatted string', () => {
        const id = service.generateId();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(id)).toBeTrue();
    });
    it('generateAccessCode should return a non-empty string', () => {
        const accessCode = service.generateAccessCode();
        expect(typeof accessCode).toBe('string');
        expect(accessCode).not.toBe('');
    });

    it('generateAccessCode should return a string of the specified length', () => {
        const ACCESS_CODE_SIZE = 4;
        const accessCode = service.generateAccessCode();
        expect(accessCode.length).toBe(ACCESS_CODE_SIZE);
    });
});
