/* eslint-disable @typescript-eslint/no-explicit-any */
import { ORG_BANNED_NAME } from '@app/app.constants';
import { Game } from './game';
import { Lobby } from './lobby';

describe('Lobby', () => {
    let lobby: Lobby;
    let game: Game;

    beforeEach(() => {
        game = new Game();
        lobby = new Lobby('lobbyId123', game, '2023-01-01T12:00:00Z');
    });

    it('should initialize lobby properties correctly in the constructor', () => {
        expect(lobby.lobbyId).toEqual('lobbyId123');
        expect(lobby.players).toBeInstanceOf(Map);
        expect(lobby.nameBan).toEqual([ORG_BANNED_NAME]);
        expect(lobby.isLocked).toBe(false);
        expect(lobby.game).toBe(game);
        expect(lobby.dateStart).toEqual('2023-01-01T12:00:00Z');
        expect(lobby.submitAnswerCount).toBe(0);
        expect(lobby.questionIndex).toBe(0);
        expect(lobby.timer).toBeNull();
        expect(lobby.currentMessages).toEqual([]);
        expect(lobby.sockets).toEqual([]);
        expect(lobby.lobbyScores).toEqual([]);
        expect(lobby.playerBonuses).toEqual('');
        expect(lobby.inGame).toBe(false);
        expect(lobby.playersToEvaluate).toEqual([]);
        expect((lobby as any).isTimerPaused).toBe(false);
        expect((lobby as any).isPanicMode).toBe(false);
        expect(lobby.numberOfPlayersAtTheBeginning).toBe(0);
        expect(lobby.choicesHistory).toEqual([]);
        expect(lobby.disabledChatList).toEqual([]);
    });

    it('should set timer paused and retrieve its state correctly', () => {
        lobby.setTimerPaused();
        expect(lobby.getIsTimerPaused()).toBe(true);

        lobby.setTimerUnpaused();
        expect(lobby.getIsTimerPaused()).toBe(false);
    });

    it('should set panic mode and retrieve its state correctly', () => {
        lobby.setPanicMode();
        expect(lobby.getIsPanicMode()).toBe(true);

        lobby.disablePanicMode();
        expect(lobby.getIsPanicMode()).toBe(false);
    });
});
