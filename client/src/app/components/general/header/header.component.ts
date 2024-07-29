import { Component, Input } from '@angular/core';
import { StateHeader } from '@app/common-client/constant/state';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    @Input() currentState: StateHeader;
    pageState = StateHeader;

    deleteSessionStorage(): void {
        sessionStorage.clear();
    }
}

export { StateHeader };
