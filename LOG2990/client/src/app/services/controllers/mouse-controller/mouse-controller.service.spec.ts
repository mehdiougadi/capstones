import { TestBed } from '@angular/core/testing';
import { MouseButton } from '@app/common-client/constant/state';
import { MouseControllerService } from './mouse-controller.service';

describe('MouseControllerService', () => {
    let service: MouseControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MouseControllerService);
    });

    it('should emit event when left mouse button is clicked', (done) => {
        service.leftClick$.subscribe(() => {
            expect(true).toBeTruthy();
            done();
        });

        const event = new MouseEvent('click', { button: MouseButton.Left });
        service.mouseHitDetect(event);
    });

    it('should not emit event when other mouse buttons are clicked', () => {
        let emitted = false;
        service.leftClick$.subscribe((state: boolean) => {
            if (state) {
                emitted = true;
            }
        });

        const event = new MouseEvent('click', { button: MouseButton.Right });
        service.mouseHitDetect(event);

        expect(emitted).toBeFalse();
    });
});
