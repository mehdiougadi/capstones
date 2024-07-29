import { Message } from './message.schema';

describe('Message', () => {
    it('should create a message with a title and a body', () => {
        const title = 'Mon Message';
        const body = new Date();
        const message = new Message();

        message.title = title;
        message.body = body;

        expect(message.title).toEqual(title);
        expect(message.body).toEqual(body);
    });
});
