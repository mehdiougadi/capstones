import { Room } from '@app/common-client/interfaces/room';
import { Player } from '@common/classes/player';
import { Question } from '@common/interfaces/question';

export interface InputQuestion {
    question: Question;
    betweenRound: boolean;
    room: Room;
    currentPlayer: Player;
}
