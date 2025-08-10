import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class KeyboardService {
    enterPressedSource = new Subject<void>();
    enterPressed$ = this.enterPressedSource.asObservable();

    handleKeyboardEventGameplay(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.enterPressedSource.next();
        }
    }
}
