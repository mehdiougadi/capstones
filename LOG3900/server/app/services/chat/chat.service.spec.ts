// Pour accéder aux attributs privés
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QuestionType } from '@app/app.constants';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

const getFakeGame = (): Game => ({
    id: getRandomString(),
    title: getRandomString(),
    description: getRandomString(),
    lastModification: '',
    duration: 10,
    questions: [getFakeQuestion(), getFakeQuestion()],
    isVisible: true,
});

const getFakeQuestion = (): Question => ({
    text: getRandomString(),
    points: 10,
    type: QuestionType.QCM,
    choices: [
        { text: 'choice1', isCorrect: true },
        { text: 'choice2', isCorrect: false },
    ],
});

const BASE_36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);

describe('ChatService', () => {
    let service: ChatService;
    const message = { playerName: 'Jasmine', message: 'bonjour', time: '3:27pm' };
    const sharedLobbies = { abcd: { lobbyId: 'abcd', game: getFakeGame(), dateStart: '2:30', currentMessages: [], disabledChatList: ['Ahmed'] } };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: ChatService,
                    useValue: service,
                },

                {
                    provide: 'SharedLobbies',
                    useValue: sharedLobbies,
                },
                ChatService,
            ],
        }).compile();
        service = module.get<ChatService>(ChatService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('updateRoomMessage should add new messages in the room messages', () => {
        const initialMessagesLength = service.getRoomMessages(sharedLobbies[lobbyId1].lobbyId).length;
        service.updateRoomMessages(sharedLobbies[lobbyId1].lobbyId, message);
        const updatedMessages = service.getRoomMessages(sharedLobbies[lobbyId1].lobbyId);
        expect(updatedMessages.length).toBe(initialMessagesLength + 1);
        expect(updatedMessages[updatedMessages.length - 1]).toEqual(message);
    });

    it('should return messages for an existing lobby', () => {
        const expectedMessages = [
            { playerName: 'Alice', message: 'Hello', time: '10:00 am' },
            { playerName: 'Bob', message: 'Hi there!', time: '10:15 am' },
        ];
        (service as any).lobbies[lobbyId1].currentMessages = expectedMessages;
        const messages = service.getRoomMessages(lobbyId1);
        expect(messages).toEqual(expectedMessages);
    });

    it('should return no messages if the lobby does not exist', () => {
        const expectedMessages = [
            { playerName: 'Alice', message: 'Hello', time: '10:00 am' },
            { playerName: 'Bob', message: 'Hi there!', time: '10:15 am' },
        ];
        (service as any).lobbies[lobbyId1].currentMessages = expectedMessages;
        const messages = service.getRoomMessages('NO_LOBBY');
        expect(messages).toEqual([]);
    });

    it('should add a player to the disabled chat list', () => {
        const initialDisabledChatListLength = (service as any).lobbies[lobbyId1].disabledChatList.length;
        service.updateDisabledChatList(lobbyId1, 'Jasmine');
        const updatedDisabledChatList = (service as any).lobbies[lobbyId1].disabledChatList;
        expect(updatedDisabledChatList.length).toBe(initialDisabledChatListLength + 1);
        expect(updatedDisabledChatList[updatedDisabledChatList.length - 1]).toEqual('Jasmine');
    });

    it('should remove a player from the disabled chat list', () => {
        const initialDisabledChatListLength = (service as any).lobbies[lobbyId1].disabledChatList.length;
        service.updateDisabledChatList(lobbyId1, 'Jasmine');
        service.updateDisabledChatList(lobbyId1, 'Jasmine');
        const updatedDisabledChatList = (service as any).lobbies[lobbyId1].disabledChatList;
        expect(updatedDisabledChatList.length).toBe(initialDisabledChatListLength);
    });

    it('should return false if the player cannot chat', () => {
        service.updateDisabledChatList(lobbyId1, 'Jasmine');
        service.updateDisabledChatList(lobbyId1, 'Jasmine');
        const canChat = service.checkIfPlayerCanChat(lobbyId1, 'Jasmine');
        expect(canChat).toBe(false);
    });

    it('should return true if the player can chat', () => {
        service.updateDisabledChatList(lobbyId1, 'Jasmine');
        const canChat = service.checkIfPlayerCanChat(lobbyId1, 'Jasmine');
        expect(canChat).toBe(true);
    });

    it('should return all socket id', () => {
        const expectedSocketId = ['socket1', 'socket2'];
        (service as any).lobbies[lobbyId1].sockets = expectedSocketId;
        const socketId = service.getAllSocketId(lobbyId1);
        expect(socketId).toEqual(expectedSocketId);
    });
});

const lobbyId1 = 'abcd';
