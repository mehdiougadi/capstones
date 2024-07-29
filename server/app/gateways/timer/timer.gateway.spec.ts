import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { TimerGateway } from './timer.gateway';

describe('TimerGateway', () => {
    let gateway: TimerGateway;
    let mockServerEmit: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TimerGateway],
        }).compile();

        gateway = module.get<TimerGateway>(TimerGateway);

        mockServerEmit = jest.fn();

        gateway['server'] = { emit: mockServerEmit } as Partial<Server> as Server;
    });

    it('should emit updateTimeForQuestion event', () => {
        const time = 10;
        const roomId = '123';

        gateway.updateTimeForQuestion(time, roomId);

        expect(mockServerEmit).toHaveBeenCalledWith(`countdownUpdate:${roomId}`, time);
    });
});
