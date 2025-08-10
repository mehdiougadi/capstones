import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NB_GAMES_PER_PAGE } from '@app/app.constants';
import { Game } from '@app/interfaces/game';
import { GameService } from '@app/services/game/game.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-carousel',
    templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.scss'],
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() isAdministration: boolean;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    gamesToDisplay: Game[];
    games: Game[];
    private gamesSubscription: Subscription;

    constructor(private readonly gameService: GameService) {
        this.gamesToDisplay = [];
        this.games = [];
    }

    ngOnInit(): void {
        this.loadGames(0);
    }

    ngAfterViewInit(): void {
        if (this.paginator) {
            // retrait du lint pour le _ car c'est une méthode d'une component de Angular Material
            // eslint-disable-next-line no-underscore-dangle
            this.paginator._intl.itemsPerPageLabel = 'Jeux par page:';
            // retrait du lint pour le _ car c'est un attribut d'une component de Angular Material
            // eslint-disable-next-line no-underscore-dangle
            this.paginator._intl.getRangeLabel = (page, pageSize, length) => {
                if (length === 0 || pageSize === 0) {
                    return `0 sur ${length}`;
                }
                length = Math.max(length, 0);
                const startIndex = page * pageSize;
                const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
                return `${startIndex + 1} - ${endIndex} sur ${length}`;
            };
            // retrait du lint pour le _ car c'est un attribut d'une component de Angular Material
            // eslint-disable-next-line no-underscore-dangle
            this.paginator._intl.nextPageLabel = 'Page suivante';
            // retrait du lint pour le _ car c'est un attribut d'une component de Angular Material
            // eslint-disable-next-line no-underscore-dangle
            this.paginator._intl.previousPageLabel = 'Page précédente';
        }
    }

    reloadComponent(deletedGame?: Game): void {
        let page: number;
        if (deletedGame) {
            page = Math.floor(this.games.findIndex((game) => game.id === deletedGame.id) / NB_GAMES_PER_PAGE);
        } else {
            this.paginator.lastPage();
            page = this.paginator.pageIndex;
            if (this.gamesToDisplay.length === NB_GAMES_PER_PAGE) {
                page++;
            }
        }
        this.loadGames(page);
    }

    loadGames(page: number): void {
        this.gamesSubscription = this.gameService.getAllGamesAdmin().subscribe({
            next: (games: Game[]) => {
                this.games = games;
                this.gamesToDisplay = this.games.slice(page * NB_GAMES_PER_PAGE, page * NB_GAMES_PER_PAGE + NB_GAMES_PER_PAGE);
                if (this.gamesToDisplay.length === 0) {
                    this.paginator.previousPage();
                } else {
                    this.paginator.pageIndex = page;
                }
            },
            error: (error) => {
                throw new Error(error);
            },
        });
    }

    onPageChange(event: PageEvent) {
        const startIndex = event.pageIndex * event.pageSize;
        let endIndex = startIndex + event.pageSize;
        if (endIndex > this.games.length) {
            endIndex = this.games.length;
        }
        this.gamesToDisplay = this.games.slice(startIndex, endIndex);
    }

    ngOnDestroy() {
        if (this.gamesSubscription) {
            this.gamesSubscription.unsubscribe();
        }
    }
}
