import { NUMBER_CHOICE_MAX, NUMBER_CHOICE_MIN, POINTS_MAX, POINTS_MIN, QUESTION_MAX_LENGTH, QuestionType } from '@app/app.constants';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ChoiceDto } from './choice/choice.dto';

export class CreateQuestionDto {
    @ApiProperty({ type: [ChoiceDto], minItems: NUMBER_CHOICE_MIN, maxItems: NUMBER_CHOICE_MAX })
    @IsArray()
    @ArrayMinSize(NUMBER_CHOICE_MIN)
    @ArrayMaxSize(NUMBER_CHOICE_MAX)
    @ValidateIf((dto: CreateQuestionDto) => dto.type === QuestionType.QCM)
    choices?: ChoiceDto[];

    @ApiProperty({ required: true, minimum: POINTS_MIN, maximum: POINTS_MAX })
    @IsNumber()
    @Max(POINTS_MAX)
    @Min(POINTS_MIN)
    points: number;

    @ApiProperty({ required: true, maxLength: QUESTION_MAX_LENGTH })
    @IsString()
    @MaxLength(QUESTION_MAX_LENGTH)
    text: string;

    @ApiProperty({ required: true })
    @IsString()
    type: QuestionType;
}
