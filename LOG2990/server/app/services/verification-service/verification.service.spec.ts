import { Room } from '@app/common-server/room';
import { Player } from '@common/classes/player';
import { GameAccess } from '@common/client-message/game-acces-pop-up';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';

describe('VerificationService', () => {
    let service: VerificationService;
    let mockRoom: Room;

    beforeEach(async () => {
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
            accessCode: 'ABC1',
            questionStats: [],
            listPlayers: [new Player('Alice'), new Player('Bob'), new Player('Charlie')],
            nameBanned: [],
            roundFinished: false,
            isLocked: false,
            isTesting: false,
            isPaused: false,
            isPanicMode: false,
            lockPlayerPoints: false,
            dateCreated: new Date(),
            numberOfPlayers: 3,
            randomMode: false,
            bestScore: 0,
            currentTime: 30,
            currentQuestionIndex: 0,
            currentState: GameState.END_ROOM,
            timer: undefined,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [VerificationService],
        }).compile();

        service = module.get<VerificationService>(VerificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generalVerification', () => {
        it('should return NAME_TOO_LONG if player name.length is over 20', () => {
            const playerConcerned: Player = new Player('ULTRALONGNOMPOURTESTERLETEST');
            const result = service.generalVerification(playerConcerned, mockRoom);
            expect(result).toEqual(GameAccess.NAME_NOT_VALID);
        });
        it('should return NAME_TAKEN if player name is in list', () => {
            const playerConcerned: Player = new Player('Alice');
            const result = service.generalVerification(playerConcerned, mockRoom);
            expect(result).toEqual(GameAccess.NAME_TAKEN);
        });

        it('should return NAME_BANNED if player name is in banned list', () => {
            const playerConcerned: Player = new Player('John');
            mockRoom.isLocked = false;
            mockRoom.nameBanned = [playerConcerned.name];
            const result = service.generalVerification(playerConcerned, mockRoom);
            expect(result).toEqual(GameAccess.NAME_BANNED);
        });

        it('should return NAME_RESERVED if player name is reserved word', () => {
            const playerConcerned: Player = new Player('Organisateur');
            mockRoom.isLocked = false;
            const result = service.generalVerification(playerConcerned, mockRoom);
            expect(result).toEqual(GameAccess.NAME_RESERVED);
        });

        it('should return ROOM_LOCKED if room is locked', () => {
            const playerConcerned: Player = new Player('John');
            mockRoom.isLocked = true;
            const result = service.generalVerification(playerConcerned, mockRoom);
            expect(result).toEqual(GameAccess.ROOM_LOCKED);
        });

        it('should return undefined if all verifications pass', () => {
            const playerConcerned: Player = new Player('John');
            mockRoom.isLocked = false;
            const result = service.generalVerification(playerConcerned, mockRoom);
            expect(result).toBeUndefined();
        });
    });
});
