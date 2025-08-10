export class Message {
    playerName: string;
    message: string;
    time: string;

    constructor(playerName: string, inputMessage: string, time: string) {
        this.playerName = playerName;
        this.message = inputMessage;
        this.time = time;
    }
}
