import { UpdateAnswerDto } from './update-answer.dto';

describe('UpdateAnswerDto', () => {
    let updateAnswerDto: UpdateAnswerDto;

    beforeEach(() => {
        updateAnswerDto = new UpdateAnswerDto();
    });

    it('should be defined', () => {
        expect(updateAnswerDto).toBeDefined();
    });

    it('should set the text property', () => {
        updateAnswerDto.text = 'Updated answer text';
        expect(updateAnswerDto.text).toEqual('Updated answer text');
    });

    it('should set the isCorrect property', () => {
        updateAnswerDto.isCorrect = true;
        expect(updateAnswerDto.isCorrect).toEqual(true);
    });

    it('should set the _id property', () => {
        updateAnswerDto._id = 'updatedId';
        expect(updateAnswerDto._id).toEqual('updatedId');
    });
});
