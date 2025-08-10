import { TestBed } from '@angular/core/testing';
import { MockSocket } from '@app/common-client/classes/mock-socket';
import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { Answer } from '@common/interfaces/answer';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Socket } from 'socket.io-client';
import { GameConnectionSocketService } from './game-connection-socket.service';

describe('GameConnectionSocketService', () => {
    let service: GameConnectionSocketService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameConnectionSocketService);
        service.socket = new MockSocket() as unknown as Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should connect', () => {
        const spy = spyOn(service, 'connect').and.callThrough();
        service.connect();
        expect(spy).toHaveBeenCalled();
    });

    it('should disconnect', () => {
        const spy = spyOn(service, 'disconnect').and.callThrough();
        service.connect();
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('should connect players to game', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        const routerSpy = spyOn(service['router'], 'navigate');

        service.connectPlayersToGame(room);
        service['socket'].emit(`startGameWithId:${room.id}`);

        expect(routerSpy).toHaveBeenCalledWith(['/game/1234'], { queryParams: { roomId: '1234', testing: false } });
        expect(spy).toHaveBeenCalledWith(`startGameWithId:${room.id}`, jasmine.any(Function));
    });

    it('should connect to game stage', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const roomState = 'waiting';
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        const nextSpy = spyOn(service['gameStageSubject'], 'next');

        service.connectToGameStage(room);
        service['socket'].emit(`sendRoomState:${room.id}`, roomState);

        expect(nextSpy).toHaveBeenCalledWith(roomState);
        expect(spy).toHaveBeenCalledWith(`sendRoomState:${room.id}`, jasmine.any(Function));
    });

    it('should connect to stats update', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const updatedStats: QuestionStats[] = [
            {
                questionIndex: 1,
                questionType: 'QCM',
                stats: {
                    ['choiceA']: { count: 10, isCorrect: true },
                    ['choiceB']: { count: 5, isCorrect: false },
                },
                statsQRL: {
                    modifiedLastSeconds: 0,
                    notModifiedLastSeconds: 0,
                    scores: {
                        zeroPercent: 0,
                        fiftyPercent: 0,
                        hundredPercent: 0,
                    },
                },
            },
            {
                questionIndex: 2,
                questionType: 'QCM',
                stats: {
                    ['choiceC']: { count: 8, isCorrect: true },
                    ['choiceD']: { count: 7, isCorrect: false },
                },
                statsQRL: {
                    modifiedLastSeconds: 0,
                    notModifiedLastSeconds: 0,
                    scores: {
                        zeroPercent: 0,
                        fiftyPercent: 0,
                        hundredPercent: 0,
                    },
                },
            },
        ];
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        const nextSpy = spyOn(service['updatedStatsSubject'], 'next');

        service.connectToStatsUpdate(room.id);
        service['socket'].emit(`sendUpdatedStats:${room.id}`, updatedStats);

        expect(nextSpy).toHaveBeenCalledWith(updatedStats);
        expect(spy).toHaveBeenCalledWith(`sendUpdatedStats:${room.id}`, jasmine.any(Function));
    });

    it('should send stats update', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const answer: Answer = {} as Answer;
        const action = 1;
        const spy = spyOn(service, 'sendStatsUpdate').and.callThrough();
        service.connect();
        service.sendStatsUpdate(room.id, answer, action);
        expect(spy).toHaveBeenCalledWith(room.id, answer, action);
    });

    it('should connect to players update', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const updatedPlayers: Player[] = [new Player('n1'), new Player('n2')];
        const spy = spyOn(service['socket'], 'on').and.callThrough();
        const nextSpy = spyOn(service['updatedPlayersSubject'], 'next');

        service.connectToPlayersUpdate(room.id);
        service['socket'].emit(`sendPlayersUpdate:${room.id}`, updatedPlayers);

        expect(nextSpy).toHaveBeenCalledWith(updatedPlayers);
        expect(spy).toHaveBeenCalledWith(`sendPlayersUpdate:${room.id}`, jasmine.any(Function));
    });

    it('should send stats update for QRL', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const index = 1;
        const spy = spyOn(service, 'sendStatsUpdateQRL').and.callThrough();
        service.connect();
        service.sendStatsUpdateQRL(room.id, index);
        expect(spy).toHaveBeenCalledWith(room.id, index);
    });
});
