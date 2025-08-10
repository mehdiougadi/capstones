import { ContextQuestionModal, StateQuestionModal } from '@app/common-client/constant/state';
import { Question } from '@common/interfaces/question';

export interface QuestionDisplayModalData {
    question: Question;
    questionContext: ContextQuestionModal;
    questionState: StateQuestionModal;
}
