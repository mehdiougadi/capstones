// retrait du lint pour le any pour acceder aux attributs privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Routes } from '@app/app.constants';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
    let service: NavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NavigationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('verifyPreviousRoute() should call isBackNavigation()', () => {
        const spyIsBackNav = spyOn(service as any, 'isBackNavigation');
        service.verifyPreviousRoute(fakeRoute);

        expect(spyIsBackNav).toHaveBeenCalled();
    });

    it('verifyPreviousRoute() should return true if isBackNavigation is true', () => {
        (service as any).previousRoute = Routes.Game;

        expect(service.verifyPreviousRoute(Routes.Lobby)).toEqual(true);
    });

    it('verifyPreviousRoute() should return false if isBackNavigation is false', () => {
        (service as any).previousRoute = fakeRoute;

        expect(service.verifyPreviousRoute(fakeRoute)).toEqual(false);
    });

    it('isBackNavigation(Routes.Lobby) should send true if previousRoute === Routes.GameOrganizer', () => {
        (service as any).previousRoute = Routes.GameOrganizer;

        expect((service as any).isBackNavigation(Routes.Lobby)).toEqual(true);
    });

    it('isBackNavigation(Routes.Lobby) should send true if previousRoute === Routes.Game', () => {
        (service as any).previousRoute = Routes.Game;

        expect((service as any).isBackNavigation(Routes.Lobby)).toEqual(true);
    });

    it('isBackNavigation(Routes.Game) should send true if previousRoute === Routes.Results', () => {
        (service as any).previousRoute = Routes.Results;

        expect((service as any).isBackNavigation(Routes.Game)).toEqual(true);
    });

    it('isBackNavigation(Routes.GameOrganizer) should send true if previousRoute === Routes.Results', () => {
        (service as any).previousRoute = Routes.Results;

        expect((service as any).isBackNavigation(Routes.GameOrganizer)).toEqual(true);
    });

    it('isBackNavigation(Routes.Home) should send true if previousRoute === Routes.Lobby', () => {
        (service as any).previousRoute = Routes.Lobby;

        expect((service as any).isBackNavigation(Routes.Home)).toEqual(true);
    });

    it('isBackNavigation(Routes.Creation) should send true if previousRoute === Routes.Game', () => {
        (service as any).previousRoute = Routes.Game;

        expect((service as any).isBackNavigation(Routes.Creation)).toEqual(true);
    });

    it('isBackNavigation(Routes.Creation) should send true if previousRoute === Routes.Lobby', () => {
        (service as any).previousRoute = Routes.Lobby;

        expect((service as any).isBackNavigation(Routes.Creation)).toEqual(true);
    });

    it('isBackNavigation() should send false if called with a Routes not corresponding to any of the listed cases', () => {
        (service as any).previousRoute = '';

        expect((service as any).isBackNavigation(fakeRoute)).toEqual(false);
    });

    const fakeRoute = 'Rimouski';
});
