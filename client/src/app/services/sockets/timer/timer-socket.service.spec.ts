import { TestBed } from '@angular/core/testing';
import { MockSocket } from '@app/common-client/classes/mock-socket';
import { Room } from '@app/common-client/interfaces/room';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { TimerSocketService } from './timer-socket.service';

describe('TimerSocketService', () => {
    let service: TimerSocketService;
    const timeSubject = new Subject<string>();

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimerSocketService);
        service['currentTimeSubject'] = timeSubject;
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

    it('should handle time updates for a room', () => {
        const room: Room = {} as Room;
        room.id = '1234';
        const mockTime = '10:00';
        const spy = spyOn(timeSubject, 'next').and.callThrough();
        service.handleTime(room);
        service.socket.emit(`countdownUpdate:${room.id}`, mockTime);
        expect(spy).toHaveBeenCalledWith(mockTime);
    });
});
