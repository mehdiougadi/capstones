// retrait du lint pour les nombres magique car c'est des constantes de tests qui ne vont pas dans des fichiers de constantes
/* eslint-disable @typescript-eslint/no-magic-numbers */
// retrait du lint pour le _ car c'est une méthode d'une component de Angular Material
/* eslint-disable no-underscore-dangle */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NB_GAMES_PER_PAGE } from '@app/app.constants';
import { LogoComponent } from '@app/components/logo/logo.component';
import { Game } from '@app/interfaces/game';
import { GameService } from '@app/services/game/game.service';
import { of, throwError } from 'rxjs';
import { CarouselComponent } from './carousel.component';

describe('CarouselComponent', () => {
    let fixture: ComponentFixture<CarouselComponent>;
    let component: CarouselComponent;
    let gameService: jasmine.SpyObj<GameService>;
    const dummyGames: Game[] = [];
    const fakeGame = {
        id: '123',
        title: 'Test Game',
        description: 'This is a test game.',
        duration: 60,
        questions: [],
    };

    beforeEach(() => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['getAllGamesAdmin']);
        const mockPaginator = jasmine.createSpyObj('MatPaginator', ['lastPage', 'previousPage']);

        TestBed.configureTestingModule({
            declarations: [CarouselComponent, LogoComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatPaginator, useValue: mockPaginator },
            ],
            imports: [MatPaginatorModule],
        });

        fixture = TestBed.createComponent(CarouselComponent);
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        gameService.getAllGamesAdmin.and.returnValue(of(dummyGames));
        component = fixture.componentInstance;
    });

    it('should set paginator labels correctly', () => {
        // retrait du lint pour accéder à la propriété privée
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).paginator = {
            _intl: new MatPaginatorIntl(),
        };
        component.ngAfterViewInit();
        expect(component.paginator._intl.itemsPerPageLabel).toEqual('Jeux par page:');
        expect(component.paginator._intl.getRangeLabel(1, 10, 100)).toEqual('11 - 20 sur 100');
        expect(component.paginator._intl.getRangeLabel(0, 10, 0)).toEqual('0 sur 0');
        expect(component.paginator._intl.getRangeLabel(0, 10, 0)).toEqual('0 sur 0');
        expect(component.paginator._intl.getRangeLabel(10, 10, 100)).toEqual('101 - 110 sur 100');
        expect(component.paginator._intl.nextPageLabel).toEqual('Page suivante');
        expect(component.paginator._intl.previousPageLabel).toEqual('Page précédente');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on initialization', () => {
        fixture.detectChanges();

        expect(component.games).toEqual(dummyGames);
        expect(component.gamesToDisplay).toEqual(dummyGames.slice(0, NB_GAMES_PER_PAGE));
    });

    it('should load games on the good page', () => {
        fixture.detectChanges();

        spyOn(component.games, 'slice').and.returnValue([fakeGame]);
        // désactivation du lint pour accéder au propriété priver
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).paginator = {
            lastPage: jasmine.createSpy('lastPage'),
            pageIndex: 0,
            previousPage: jasmine.createSpy('previousPage'),
        };
        component.loadGames(1);
        expect(component.paginator.pageIndex).toEqual(1);
    });

    it('should handle loading games error', () => {
        const errorMessage = 'Some error message';
        gameService.getAllGamesAdmin.and.returnValue(throwError(() => new Error(errorMessage)));
        fixture.detectChanges();

        expect(component.games).toEqual([]);
        expect(component.gamesToDisplay).toEqual([]);
    });

    it('should reload games when calling reloadComponent', () => {
        // désactivation du lint pour accéder au propriété priver
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).paginator = {
            lastPage: jasmine.createSpy('lastPage'),
            pageIndex: 0,
            previousPage: jasmine.createSpy('previousPage'),
        };

        component.games = [];
        component.gamesToDisplay = [];

        spyOn(component, 'loadGames');
        component.reloadComponent();

        expect(component.loadGames).toHaveBeenCalled();
    });

    it('should reload games on the good page when calling reloadComponent', () => {
        // désactivation du lint pour accéder au propriété priver
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).paginator = {
            lastPage: jasmine.createSpy('lastPage'),
            pageIndex: 0,
            previousPage: jasmine.createSpy('previousPage'),
        };
        component.gamesToDisplay = [fakeGame, fakeGame, fakeGame, fakeGame];

        spyOn(component, 'loadGames');
        component.reloadComponent();
        expect(component.loadGames).toHaveBeenCalledWith(1);
        expect(component.loadGames).toHaveBeenCalled();
    });

    it('should call previous game when it delete the last game on a page', () => {
        // désactivation du lint pour accéder au propriété priver
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).paginator = {
            lastPage: jasmine.createSpy('lastPage'),
            pageIndex: 0,
            previousPage: jasmine.createSpy('previousPage'),
        };
        component.gamesToDisplay = [fakeGame];

        spyOn(component, 'loadGames');
        component.reloadComponent(fakeGame);
        // désactivation du lint pour accéder au propriété priver
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(component.loadGames).toHaveBeenCalled();
    });

    it('should handle page change', () => {
        fixture.detectChanges();

        const pageEvent: PageEvent = {
            length: dummyGames.length,
            pageIndex: 1,
            pageSize: 2,
            previousPageIndex: 0,
        };

        component.onPageChange(pageEvent);

        expect(component.gamesToDisplay).toEqual(dummyGames.slice(2, NB_GAMES_PER_PAGE));
    });
});
