import { CreateAnswerDto } from './create-answer.dto';

describe('CreateAnswerDto', () => {
    let createAnswerDto: CreateAnswerDto;

    beforeEach(() => {
        createAnswerDto = new CreateAnswerDto();
    });

    it('should be defined', () => {
        expect(createAnswerDto).toBeDefined();
    });

    it('should set the text property', () => {
        createAnswerDto.text = 'Just some text';
        expect(createAnswerDto.text).toEqual('Just some text');
    });

    it('should set the isCorrect property', () => {
        createAnswerDto.isCorrect = true;
        expect(createAnswerDto.isCorrect).toEqual(true);
    });

    it('should set the _id property', () => {
        createAnswerDto._id = 'log2990Id';
        expect(createAnswerDto._id).toEqual('log2990Id');
    });
});
