import { Injectable } from '@angular/core';
import { Routes } from '@app/app.constants';

@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    private previousRoute: string;

    constructor() {
        this.previousRoute = '';
    }

    verifyPreviousRoute(currentRoute: string): boolean {
        const isBackNavigation = this.isBackNavigation(currentRoute);
        this.previousRoute = !isBackNavigation ? currentRoute : '';
        return isBackNavigation;
    }

    private isBackNavigation(currentRoute: string): boolean {
        switch (currentRoute) {
            case Routes.Lobby:
                return this.previousRoute === Routes.GameOrganizer || this.previousRoute === Routes.Game;

            case Routes.Game:
            case Routes.GameOrganizer:
                return this.previousRoute === Routes.Results;

            case Routes.Home:
                return this.previousRoute === Routes.Lobby;

            case Routes.Creation:
                return this.previousRoute === Routes.Game || this.previousRoute === Routes.Lobby;

            default:
                return false;
        }
    }
}
