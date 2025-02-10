// code utilisé du professeur: Nikolay Radoev gitlab: https://gitlab.com/nikolayradoev/socket-io-exemple
// sert à aider pour les tests des socket
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// eslint-disable-next-line @typescript-eslint/ban-types
type CallbackSignature = (params: unknown) => {};

export class SocketTestHelper {
    on(event: string, callback: CallbackSignature): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        this.callbacks.get(event)!.push(callback);
    }
    // sert à pourvoir faire un mock de emit n'importe lequel type de paramètre en test helper pour les sockets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
    emit(event: string, ...params: any): void {
        return;
    }

    disconnect(): void {
        return;
    }

    peerSideEmit(event: string, params?: unknown) {
        for (const callback of this.callbacks.get(event)!) {
            callback(params);
        }
    }

    removeAllListeners() {
        return;
    }

    private callbacks = new Map<string, CallbackSignature[]>();
}
