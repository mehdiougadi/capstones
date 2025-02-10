import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GameMode, GameState, Routes, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { Game } from '@app/interfaces/game';
import { GameService } from '@app/services/game/game.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-game-creation-page',
    templateUrl: './game-creation-page.component.html',
    styleUrls: ['./game-creation-page.component.scss'],
    animations: [
        trigger('expandCollapse', [
            state('collapsed', style({ height: '40px' })),
            state('expanded', style({ height: '*' })),
            transition('collapsed <=> expanded', animate('300ms ease-in-out')),
        ]),
    ],
})
export class GameCreationPageComponent implements OnInit, OnDestroy {
    @ViewChild('scrollableList', { static: false }) scrollableList: ElementRef;

    games: Game[];
    gameState: { [id: string]: GameState };
    questionState: { [indexCombination: string]: GameState };
    mode: GameMode;
    selectedGameId: string;

    // les quatre paramètre sont nécessaire
    // eslint-disable-next-line max-params
    constructor(
        private readonly navigationService: NavigationService,
        private readonly gameService: GameService,
        private readonly socketClientService: SocketClientService,
        private router: Router,
    ) {
        this.games = [];
        this.gameState = {};
        this.questionState = {};
    }

    ngOnInit() {
        if (this.navigationService.verifyPreviousRoute(Routes.Creation)) {
            this.socketClientService.on(SocketClientEventsListen.RoomId, async (roomId: string) => {
                if (roomId) {
                    this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
                }
            });
        }
        this.socketClientService.send(SocketServerEventsSend.RequestRoomId);

        this.gameService.getAllGames().subscribe((response: Game[]) => {
            this.games = response;

            this.games.forEach((game) => {
                this.gameState[game.id] = GameState.Collapsed;
            });

            this.games.forEach((game, gameIndex) => {
                game.questions.forEach((_, questionIndex) => {
                    const indexCombination = gameIndex + '-' + questionIndex;
                    this.questionState[indexCombination] = GameState.Collapsed;
                });
            });
        });

        this.listenForCreatedRoom();
    }

    ngOnDestroy() {
        if (this.socketClientService.socket.removeAllListeners) {
            this.socketClientService.socket.removeAllListeners();
        }
    }

    toggleGameState(id: string) {
        Object.keys(this.gameState).forEach((gameId) => {
            if (gameId !== id) {
                this.gameState[gameId] = GameState.Collapsed;
            }
        });

        this.gameState[id] = this.gameState[id] === GameState.Collapsed ? GameState.Expanded : GameState.Collapsed;
    }

    closeGameBox(id: string, event: Event) {
        this.gameState[id] = GameState.Collapsed;
        event.stopPropagation();
    }

    toggleQuestionState(indexCombination: string) {
        const currentState = this.questionState[indexCombination];

        Object.keys(this.questionState).forEach((indexComb) => {
            this.questionState[indexComb] = GameState.Collapsed;
        });

        this.questionState[indexCombination] = currentState === GameState.Collapsed ? GameState.Expanded : GameState.Collapsed;
    }

    listenForCreatedRoom() {
        this.socketClientService.on(SocketClientEventsListen.RoomCreation, (data: { success: boolean; message: string }) => {
            if (data.success) {
                if (this.mode === GameMode.Player) {
                    this.router.navigate([Routes.Lobby, this.selectedGameId]);
                } else {
                    this.router.navigate(['/game', GameMode.Test, this.selectedGameId]);
                }
            } else {
                alert(data.message);
            }
        });
    }

    createRoomAndNavigate(gameId: string) {
        this.mode = GameMode.Player;
        this.selectedGameId = gameId;
        this.socketClientService.send(SocketServerEventsSend.CreateRoom, gameId);
    }

    navigateToTestGame(gameId: string) {
        this.mode = GameMode.Test;
        this.selectedGameId = gameId;
        this.socketClientService.send(SocketServerEventsSend.CreateRoom, gameId);
    }
}
