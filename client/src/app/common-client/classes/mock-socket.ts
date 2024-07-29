import { Subject } from 'rxjs';

export class MockSocket {
    private events: { [eventName: string]: Subject<unknown> } = {};

    on(eventName: string, callback: (data: unknown) => void): void {
        if (!this.events[eventName]) {
            this.events[eventName] = new Subject<unknown>();
        }
        this.events[eventName].subscribe(callback);
    }

    emit(eventName: string, data: unknown): void {
        if (this.events[eventName]) {
            this.events[eventName].next(data);
        }
    }
}
