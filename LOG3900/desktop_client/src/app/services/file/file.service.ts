import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL_GAME, ENGLISH_TEXT_LENGTH, ENTER_GAME_TITLE, REQUIRED_PROP } from '@app/app.constants';
import { Game } from '@app/interfaces/game';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
    providedIn: 'root',
})
export class FileService {
    constructor(
        private readonly gameValidationService: GameValidationService,
        private readonly gameService: GameService,
        private readonly http: HttpClient,
    ) {}

    exportGame(gameId: string): Observable<Blob> {
        const url = `${API_URL_GAME}/export/${gameId}`;
        return this.http.post(url, {}, { responseType: 'blob' });
    }

    async importGame(fileInput: HTMLInputElement): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!fileInput.files || fileInput.files.length === 0) {
                resolve('SystemError');
                return;
            }
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = (event: ProgressEvent<FileReader>) => {
                try {
                    const fileContents = event.target?.result;
                    if (!fileContents) return;
                    const gameData = JSON.parse(fileContents as string);
                    const validator = this.gameValidationService.validateGame(gameData);

                    if (validator.valid) {
                        gameData.isVisible = false;
                        gameData.description = 'empty';
                        this.gameService.createGame(gameData).subscribe({
                            next: () => {
                                resolve('Done');
                            },
                            error: (error) => {
                                if (error.statusCode === HttpStatusCode.Forbidden) {
                                    this.retryWithNewTitle(gameData, resolve);
                                } else {
                                    resolve(error.message[0]);
                                }
                            },
                        });
                    } else {
                        const errors = validator.errors
                            .map((error) => {
                                const property = error.message.substring(ENGLISH_TEXT_LENGTH);
                                return REQUIRED_PROP + property;
                            })
                            .join('\n');
                        resolve(errors);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    private retryWithNewTitle(gameData: Game, resolve: (value: string | PromiseLike<string>) => void) {
        this.promptForNewTitleAndRetry(gameData).then((newGameData) => {
            if (newGameData) {
                this.gameService.createGame(newGameData).subscribe({
                    next: () => {
                        resolve('Done');
                    },
                    error: () => {
                        this.retryWithNewTitle(gameData, resolve);
                    },
                });
            }
        });
    }

    private async promptForNewTitleAndRetry(oldGameData: Game): Promise<Game | null> {
        const newTitle = prompt(ENTER_GAME_TITLE);
        if (newTitle !== null) {
            const newGameData = { ...oldGameData };
            newGameData.title = newTitle;
            return newGameData;
        }
        return null;
    }
}
