import { NUMBER_CHOICE_MAX, NUMBER_CHOICE_MIN, POINTS_MAX, POINTS_MIN, QUESTION_MAX_LENGTH, QuestionType } from '@app/app.constants';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ChoiceDto } from './choice/choice.dto';
export class UpdateQuestionDto {
    @ApiProperty({ required: false, type: [ChoiceDto], minItems: NUMBER_CHOICE_MIN, maxItems: NUMBER_CHOICE_MAX })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(NUMBER_CHOICE_MIN)
    @ArrayMaxSize(NUMBER_CHOICE_MAX)
    choices?: ChoiceDto[];

    @ApiProperty({ required: false, minimum: POINTS_MIN, maximum: POINTS_MAX })
    @IsOptional()
    @IsNumber()
    @Max(POINTS_MAX)
    @Min(POINTS_MIN)
    points?: number;

    @ApiProperty({ required: false, maxLength: QUESTION_MAX_LENGTH })
    @IsOptional()
    @IsString()
    @MaxLength(QUESTION_MAX_LENGTH)
    text?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    type?: QuestionType;
}
