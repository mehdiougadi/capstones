export class CustomHttpError {
    statusCode: number;
    message: string[];
    error: string;
    constructor(statusCode: number, message: string, error: string) {
        this.statusCode = statusCode;
        this.message = [];
        this.message.push(message);
        this.error = error;
    }
}
