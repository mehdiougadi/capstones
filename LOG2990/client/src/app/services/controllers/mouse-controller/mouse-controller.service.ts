import { Injectable } from '@angular/core';
import { MouseButton } from '@app/common-client/constant/state';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MouseControllerService {
    leftClickSource = new Subject<boolean>();
    leftClick$ = this.leftClickSource.asObservable();

    mouseHitDetect(event: MouseEvent) {
        if (event.button === MouseButton.Left) {
            this.leftClickSource.next(true);
        } else {
            this.leftClickSource.next(false);
        }
    }
}
