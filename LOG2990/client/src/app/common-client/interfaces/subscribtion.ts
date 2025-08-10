import { Subscription } from 'rxjs';
export interface Subscriptions {
    gameStageSubscription?: Subscription;
    verificationAnswersSubscription?: Subscription;
    keyboardSubscription?: Subscription;
    mouseClickSubscription?: Subscription;
    choicesSubscription?: Subscription;
    roomSubscription?: Subscription;
    leaveRoomSubscription?: Subscription;
    betweenRoundSubscription?: Subscription;
    gameFinishedSubscription?: Subscription;
    currentQuestionSubscription?: Subscription;
    currentPlayerSubscription?: Subscription;
    gameSubscription?: Subscription;
    timerSubscription?: Subscription;
    updatedPlayersSubscription?: Subscription;
    setQrlAnswerSubscription?: Subscription;
}
