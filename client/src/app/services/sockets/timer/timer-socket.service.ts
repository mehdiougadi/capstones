import { Injectable } from '@angular/core';
import { Room } from '@app/common-client/interfaces/room';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class TimerSocketService {
    currentRoom: Room;
    currentTime: number;
    socket: Socket;

    private currentTimeSubject = new Subject<string>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    currentTimeSubject$ = this.currentTimeSubject.asObservable();

    connect() {
        const serverUrlWithoutApi = environment.serverUrl.replace('/api', '');
        this.socket = io(serverUrlWithoutApi);
    }

    handleTime(room: Room) {
        if (room) {
            this.socket.on(`countdownUpdate:${room.id}`, (time) => {
                this.currentTimeSubject.next(time);
            });
        }
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
