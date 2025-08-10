import { Injectable } from '@angular/core';
import { PlayerState } from '@app/app.constants';
import { Player } from '@app/interfaces/player';

@Injectable({
    providedIn: 'root',
})
export class PlayerSortingService {
    sortPlayersByName(order: boolean, players: Player[]): void {
        players.sort((firstPlayer, secondPlayer) => {
            const nameFirstPlayer = firstPlayer.name.toLowerCase();
            const nameSecondPlayer = secondPlayer.name.toLowerCase();
            if (order) {
                return nameFirstPlayer.localeCompare(nameSecondPlayer);
            } else {
                return nameSecondPlayer.localeCompare(nameFirstPlayer);
            }
        });
    }
    sortPlayersByPoints(order: boolean, players: Player[]): void {
        players.sort((firstPlayer, secondPlayer) => {
            if (order) {
                if (firstPlayer.points === secondPlayer.points) {
                    return firstPlayer.name.localeCompare(secondPlayer.name);
                }
                return firstPlayer.points - secondPlayer.points;
            } else {
                if (firstPlayer.points === secondPlayer.points) {
                    return secondPlayer.name.localeCompare(firstPlayer.name);
                }
                return secondPlayer.points - firstPlayer.points;
            }
        });
    }
    sortPlayersByState(order: boolean, players: Player[]): void {
        const stateOrder: { [key: string]: number } = {
            [PlayerState.NoInteraction]: 1,
            [PlayerState.FirstInteraction]: 2,
            [PlayerState.Confirmation]: 3,
            [PlayerState.Abandoned]: 4,
        };
        players.sort((firstPlayer, secondPlayer) => {
            const stateFirstPlayer = stateOrder[firstPlayer.state];
            const stateSecondPlayer = stateOrder[secondPlayer.state];
            if (order) {
                if (stateFirstPlayer === stateSecondPlayer) {
                    return firstPlayer.name.localeCompare(secondPlayer.name);
                }
                return stateSecondPlayer - stateFirstPlayer;
            }
            if (stateFirstPlayer === stateSecondPlayer) {
                return secondPlayer.name.localeCompare(firstPlayer.name);
            }
            return stateFirstPlayer - stateSecondPlayer;
        });
    }
}
