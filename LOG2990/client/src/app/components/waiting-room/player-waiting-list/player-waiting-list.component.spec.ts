import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Room } from '@app/common-client/interfaces/room';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { Player } from '@common/classes/player';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { PlayerWaitingListComponent } from './player-waiting-list.component';

describe('PlayerWaitingListComponent', () => {
    let component: PlayerWaitingListComponent;
    let fixture: ComponentFixture<PlayerWaitingListComponent>;
    let roomManagerService: jasmine.SpyObj<RoomManagerService>;

    beforeEach(() => {
        const roomManagerSpy = jasmine.createSpyObj('RoomManagerService', ['banPlayerFromRoom']);

        TestBed.configureTestingModule({
            declarations: [PlayerWaitingListComponent],
            providers: [{ provide: RoomManagerService, useValue: roomManagerSpy }],
        });

        fixture = TestBed.createComponent(PlayerWaitingListComponent);
        component = fixture.componentInstance;
        roomManagerService = TestBed.inject(RoomManagerService) as jasmine.SpyObj<RoomManagerService>;
    });

    it('should call banPlayerFromRoom when banPlayer is called', () => {
        const mockPlayer: Player = new Player('MockPlayer');
        const currentRoom: Room = {
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

        component.currentRoom = currentRoom;
        component.banPlayer(mockPlayer);

        expect(roomManagerService.banPlayerFromRoom).toHaveBeenCalledWith(mockPlayer, currentRoom);
    });
});
