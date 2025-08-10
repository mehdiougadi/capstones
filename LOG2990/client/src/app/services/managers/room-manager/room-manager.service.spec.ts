/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AddPlayerResponse } from '@app/common-client/interfaces/add-player';
import { Room } from '@app/common-client/interfaces/room';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { Player } from '@common/classes/player';
import { OrganizerMessage } from '@common/client-message/organizer-game-pop-up';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Quiz } from '@common/interfaces/quiz';
import { of } from 'rxjs';
import { RoomManagerService } from './room-manager.service';

describe('RoomManagerService', () => {
    let service: RoomManagerService;
    let httpMock: HttpTestingController;
    let mockRoom: Room;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let mockRouter: jasmine.SpyObj<Router>;
    let gameManagerSpy: jasmine.SpyObj<GameManager>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatDialog', ['open']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        gameManagerSpy = jasmine.createSpyObj('RoomManagerService', ['joinRoom']);
        mockRoom = {
            id: '1',
            quiz: {
                _id: '123',
                title: 'Fake Quiz',
                description: 'Fake description',
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '1',
                        text: 'Quelle est la capitale de la France?',
                        type: QuestionType.QCM,
                        points: 10,
                        choices: [
                            { text: 'Paris', isCorrect: true },
                            { text: 'Berlin', isCorrect: false },
                            { text: 'Londres', isCorrect: false },
                            { text: 'Madrid', isCorrect: false },
                        ],
                        date: new Date(),
                    },
                    {
                        _id: '2',
                        text: 'En quelle année a été déclarée la Première Guerre mondiale?',
                        type: QuestionType.QCM,
                        points: 15,
                        choices: [
                            { text: '1914', isCorrect: true },
                            { text: '1918', isCorrect: false },
                            { text: '1922', isCorrect: false },
                            { text: '1939', isCorrect: false },
                        ],
                        date: new Date(),
                    },
                ],
                duration: 30,
            },
            currentQuestionIndex: 0,
            accessCode: 'ABC1',
            listPlayers: [new Player('Alice'), new Player('Bob'), new Player('Charlie')],
            currentTime: 30,
            roundFinished: false,
            isLocked: false,
            isTesting: false,
            isPaused: false,
            questionStats: [],
            currentState: GameState.END_ROUND,
        };
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule],
            providers: [
                RoomManagerService,
                { provide: MatDialog, useValue: spy },
                { provide: Router, useValue: mockRouter },
                { provide: GameManager, useValue: gameManagerSpy },
            ],
        });
        service = TestBed.inject(RoomManagerService);
        httpMock = TestBed.inject(HttpTestingController);
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        spyOn(Audio.prototype, 'play');
    });
    afterEach(() => {
        httpMock.verify();
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should create a room', () => {
        const quiz: Quiz = mockRoom.quiz;
        service.createRoom(quiz);
        const req = httpMock.expectOne(`${service['roomURL']}`);
        expect(req.request.method).toBe('POST');
        req.flush(mockRoom);
        expect(mockRouter.navigate).toHaveBeenCalled();
    });
    it('should open message dialog for unlocked room', () => {
        mockRoom.isLocked = false;
        service.startGameForRoom(mockRoom, true);
        expect(dialogSpy.open).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message: OrganizerMessage.UNLOCKED_ROOM },
        });
    });
    it('should join a room', () => {
        const username = 'testUser';
        const accessCode = '123456';

        const joinRoomSpy = spyOn(service, 'joinRoom').and.callThrough();
        service.joinRoom(username, accessCode);
        expect(joinRoomSpy).toHaveBeenCalledWith(username, accessCode);
    });
    it('should leave a room', () => {
        const username = 'testUser';
        const roomId = '123';

        const leaveRoomSpy = spyOn(service, 'leaveRoom').and.callThrough();
        service.leaveRoom(username, roomId);
        expect(leaveRoomSpy).toHaveBeenCalledWith(username, roomId);

        const request = httpMock.expectOne(
            (req) =>
                req.method === 'POST' &&
                req.url === `${service['roomURL']}/removePlayer` &&
                req.params.get('username') === username &&
                req.params.get('roomId') === roomId,
        );
        expect(request.request.method).toBe('POST');
        expect(request.request.params.get('username')).toBe(username);
        expect(request.request.params.get('roomId')).toBe(roomId);
        request.flush('success');
    });
    it('should change lock status of a room', () => {
        const changeLockSpy = spyOn(service, 'changeLockRoom').and.callThrough();
        service.changeLockRoom(mockRoom);
        expect(changeLockSpy).toHaveBeenCalledWith(mockRoom);
        const request = httpMock.expectOne(`${service['roomURL']}/changeLock`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ room: mockRoom });
        request.flush('success');
    });
    it('should fetch a room by ID', async () => {
        const fetchRoomByIdSpy = spyOn(service, 'fetchRoomById').and.callThrough();
        service.fetchRoomById(mockRoom.id);

        expect(fetchRoomByIdSpy).toHaveBeenCalledWith(mockRoom.id);

        const request = httpMock.expectOne(`${service['roomURL']}/${mockRoom.id}`);
        expect(request.request.method).toBe('GET');
        request.flush(mockRoom);
    });
    it('should open message dialog for empty room', () => {
        mockRoom.isLocked = true;
        mockRoom.listPlayers = [];

        service.startGameForRoom(mockRoom, false);

        expect(dialogSpy.open).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message: OrganizerMessage.EMPTY_ROOM },
        });
    });
    it('should start the game and access the game if modeType is true', () => {
        mockRoom.isLocked = true;
        mockRoom.listPlayers = [new Player('Alice'), new Player('Bob'), new Player('Charlie')];
        const startGameSpy = spyOn(service, 'startGameForRoom').and.callThrough();
        const accessGameSpy = spyOn(service as any, 'accessGame');

        service.startGameForRoom(mockRoom, true);

        expect(startGameSpy).toHaveBeenCalledWith(mockRoom, true);

        const req = httpMock.expectOne(`${service['roomURL']}/startGame`);
        expect(req.request.method).toBe('POST');

        req.flush('success');

        expect(accessGameSpy).toHaveBeenCalledWith(mockRoom);
    });
    it('should start the game for a locked room with players', () => {
        mockRoom.isLocked = true;
        mockRoom.listPlayers = [new Player('Alice'), new Player('Bob'), new Player('Charlie')];

        const startSpy = spyOn(service, 'startGameForRoom').and.callThrough();
        service.startGameForRoom(mockRoom, true);
        expect(startSpy).toHaveBeenCalledWith(mockRoom, true);

        const request = httpMock.expectOne(`${service['roomURL']}/startGame`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body.room).toEqual(mockRoom);
    });
    it('should start the game for a random mode game room with players', () => {
        mockRoom.isLocked = true;
        mockRoom.listPlayers = [new Player('Alice'), new Player('Bob'), new Player('Charlie')];

        const startSpy = spyOn(service, 'startGameForRoom').and.callThrough();
        service.startGameForRoom(mockRoom, false);
        expect(startSpy).toHaveBeenCalledWith(mockRoom, false);

        const request = httpMock.expectOne(`${service['roomURL']}/startGame`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body.room).toEqual(mockRoom);
    });
    it('should advance to the next round', () => {
        mockRoom.currentQuestionIndex = 0;
        const expectedRoom = { ...mockRoom, currentQuestionIndex: 1 };

        service.advanceToNextRound(mockRoom);

        const request = httpMock.expectOne(`${service['roomURL']}/nextRound`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body.room).toEqual(expectedRoom);
    });
    it('should ban a player from the room', () => {
        const mockPlayer = new Player('Test Player');

        service.banPlayerFromRoom(mockPlayer, mockRoom);

        const request = httpMock.expectOne(`${service['roomURL']}/banPlayer`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ player: mockPlayer, room: mockRoom });
    });
    it('should update interaction of a player from the room', () => {
        const mockPlayer = new Player('Test Player');

        service.sendUpdatedInteraction(mockRoom.id, mockPlayer);

        const request = httpMock.expectOne(`${service['roomURL']}/interaction`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ roomId: mockRoom.id, player: mockPlayer });
    });
    it('should update qrl interaction of a player from the room', () => {
        const mockPlayer = new Player('Test Player');

        service.sendQrlInteraction(mockRoom.id, mockPlayer);

        const request = httpMock.expectOne(`${service['roomURL']}/qrlInteraction`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ roomId: mockRoom.id, player: mockPlayer });
    });
    it('should update the list of players in the room', () => {
        const mockPlayers = [new Player('Player 1'), new Player('Player 2'), new Player('Player 3')];

        service.sendUpdatedListPlayers(mockRoom.id, mockPlayers);

        const request = httpMock.expectOne(`${service['roomURL']}/updateListPlayers`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ roomId: mockRoom.id, listPlayers: mockPlayers });
    });
    it('should set the sorting parameters for the roomService', () => {
        service.setPropertyAndDirection('interaction', 'desc', mockRoom);

        expect(service['property']).toEqual('interaction');
        expect(service['sortDirection']).toEqual('desc');
    });
    it('should sort the list of players in a by points', () => {
        service['property'] = 'points';
        service['sortDirection'] = 'desc';
        mockRoom.listPlayers[0].points = 100;
        mockRoom.listPlayers[1].points = 150;
        mockRoom.listPlayers[2].points = 200;

        service.sortCurrentPlayerList(mockRoom);

        expect(mockRoom.listPlayers[0].name).toBe('Charlie');
        expect(mockRoom.listPlayers[1].name).toBe('Bob');
        expect(mockRoom.listPlayers[2].name).toBe('Alice');
    });
    it('should sort the list of players in a by interaction', () => {
        service['property'] = 'interaction';
        service['sortDirection'] = 'desc';
        service['colorOrder'] = ['red', 'yellow', 'green', 'black'];
        mockRoom.listPlayers[0].interaction = 'red';
        mockRoom.listPlayers[1].interaction = 'green';
        mockRoom.listPlayers[2].interaction = 'red';

        service.sortCurrentPlayerList(mockRoom);

        expect(mockRoom.listPlayers[0].name).toBe('Bob');
        expect(mockRoom.listPlayers[1].name).toBe('Alice');
        expect(mockRoom.listPlayers[2].name).toBe('Charlie');
    });
    it('should sort the list of players in a by name', () => {
        service['property'] = 'name';
        service['sortDirection'] = 'asc';
        mockRoom.listPlayers[1].name = 'Alicf';

        service.sortCurrentPlayerList(mockRoom);

        expect(mockRoom.listPlayers[0].name).toBe('Alice');
        expect(mockRoom.listPlayers[1].name).toBe('Alicf');
        expect(mockRoom.listPlayers[2].name).toBe('Charlie');
    });
    it('should sort players by name when other properties are equal', () => {
        mockRoom.listPlayers[0].points = 100;
        mockRoom.listPlayers[1].points = 100;
        mockRoom.listPlayers[2].points = 100;
        service['property'] = 'points';
        service['sortDirection'] = 'asc';
        service.sortCurrentPlayerList(mockRoom);

        expect(mockRoom.listPlayers[0].name).toBe('Charlie');
        expect(mockRoom.listPlayers[1].name).toBe('Bob');
        expect(mockRoom.listPlayers[2].name).toBe('Alice');
    });
    it('accessGame should navigate to room on successful join', () => {
        const mockResponse: AddPlayerResponse = { id: '123', msg: '' };
        gameManagerSpy.joinRoom.and.returnValue(of(mockResponse));

        service['accessGame'](mockRoom);

        expect(sessionStorage.getItem('currentPlayer')).toEqual(JSON.stringify(new Player('Organisateur')));
        expect(gameManagerSpy.joinRoom).toHaveBeenCalledWith('Organisateur', 'ABC1', true);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/room/123']);
    });
});
