import { TestBed } from '@angular/core/testing';
import { KeyboardService } from './keyboard-controller.service';

describe('KeyboardService', () => {
    let service: KeyboardService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(KeyboardService);
    });

    it('should emit event when Enter key is pressed', (done) => {
        service.enterPressed$.subscribe(() => {
            expect(true).toBeTruthy();
            done();
        });

        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        service.handleKeyboardEventGameplay(event);
    });

    it('should not emit event when other keys are pressed', () => {
        let emitted = false;
        service.enterPressed$.subscribe(() => {
            emitted = true;
        });

        const event = new KeyboardEvent('keydown', { key: 'Space' });
        service.handleKeyboardEventGameplay(event);
        expect(emitted).toBeFalse();
    });
});
