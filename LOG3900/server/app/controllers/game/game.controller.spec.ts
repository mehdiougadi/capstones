import { ErrorType, State } from '@app/app.constants';
import { Game } from '@app/model/database/game';
import { GameService } from '@app/services/game/game.service';
import { HttpStatus } from '@nestjs/common/enums';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GameController } from './game.controller';

describe.only('GameController', () => {
    let controller: GameController;
    let gameService: SinonStubbedInstance<GameService>;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameController],
            providers: [
                {
                    provide: GameService,
                    useValue: gameService,
                },
            ],
        }).compile();
        controller = module.get<GameController>(GameController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAllGames() should return all games', async () => {
        const fakeGame = [new Game(), new Game()];
        gameService.getAllGames.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.findAllGames(res);
    });

    it('findAllGames() should return NOT_FOUND when service is unable to fetch all games', async () => {
        gameService.getAllGames.rejects(new Error(ErrorType.NotFoundGame));

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findAllGames(res);
    });

    it('findAllGamesVisible() should return all games visible', async () => {
        const fakeGame = [new Game(), new Game()];
        gameService.getAllGames.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.findAllGamesVisible(res);
    });

    it('findAllGamesVisible() should return NOT_FOUND status when service unable to fetch all games visible', async () => {
        gameService.getAllGames.rejects(new Error(ErrorType.NotFoundGame));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findAllGamesVisible(res);
    });

    it('findGame() should return the game', async () => {
        const fakeGame = new Game();
        gameService.getGame.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.findGame('', res);
    });

    it('findGameAdmin() should return the game', async () => {
        const fakeGame = new Game();
        gameService.getGame.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.findGameAdmin('', res);
    });

    it('findGame() should return NOT_FOUND when service is unable to fetch the game', async () => {
        gameService.getGame.rejects(new Error(ErrorType.NotFoundGame));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findGame('', res);
    });

    it('findGameAdmin() should return NOT_FOUND when service is unable to fetch the game', async () => {
        gameService.getGame.rejects(new Error(ErrorType.NotFoundGame));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.findGameAdmin('', res);
    });

    it('createGame() should return CREATED when service create a game', async () => {
        gameService.createGame.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.send = () => res;

        await controller.createGame(new Game(), res);
    });

    it('createGame() should return FORBIDDEN when the title already exist', async () => {
        gameService.createGame.rejects(new Error(ErrorType.ForbiddenTitle));

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.FORBIDDEN);
            return res;
        };
        res.send = () => res;

        await controller.createGame(new Game(), res);
    });

    it('modifyGame() should succeed if service is able to modify the game', async () => {
        gameService.updateGame.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.modifyGame('', new Game(), res);
    });

    it('modifyGame() should return BAD_REQUEST when service cannot modify the game', async () => {
        gameService.updateGame.rejects(new Error(ErrorType.BadRequestQuestion));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.send = () => res;

        await controller.modifyGame('', new Game(), res);
    });

    it('deleteGame() should succeed if service is able to delete the game', async () => {
        gameService.deleteGame.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteGame('', res);
    });

    it('deleteGame() should return INTERNAL_SERVER_ERROR when an error is not handle in the list', async () => {
        gameService.deleteGame.rejects(new Error('pi error'));
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.deleteGame('', res);
    });

    describe('exportGame', () => {
        it('should export a game as JSON file', async () => {
            const gameId = 'valid_game_id';
            const mockGame = {
                id: '1',
                title: 'Sample Quiz',
                duration: 60,
                lastModification: '2023-10-01T12:00:00Z',
                questions: [
                    {
                        type: 'QCM',
                        text: 'Sample Question',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice 1',
                                isCorrect: true,
                            },
                            {
                                text: 'Choice 2',
                                isCorrect: false,
                            },
                        ],
                    },
                ],
            };

            const mockResponse: Partial<Response> = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            const mockGameServiceGetGame = jest.spyOn(gameService, 'getGame').mockResolvedValue(mockGame as Game);

            await controller.exportGame(gameId, mockResponse as Response);

            expect(mockGameServiceGetGame).toHaveBeenCalledWith(gameId, State.Export);
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename=${mockGame.title}.json`);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.send).toHaveBeenCalledWith(JSON.stringify(mockGame));
        });

        it('should handle error and return the appropriate response', async () => {
            const gameId = 'invalid_game_id';
            const errorMessage = ErrorType.InternalServerError;

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            const mockGameServiceGetGame = jest.spyOn(gameService, 'getGame').mockRejectedValue(new Error(ErrorType.InternalServerError));

            await controller.exportGame(gameId, mockResponse as Response);

            expect(mockGameServiceGetGame).toHaveBeenCalledWith(gameId, State.Export);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: [errorMessage],
                error: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });
        });
    });
});
