export namespace QuestionMessage {
    export const CREATE_QUESTION_SUCCESS = 'Vous avez créé la question avec succès.';
    export const MODIFY_QUESTION_SUCCESS = 'Vous avez modifié la question avec succès.';
    export const DELETE_QUESTION_SUCCESS = 'Vous avez supprimé la question avec succès.';
    export const DELETE_QUESTION_FAIL = 'Erreur lors de la suppression de la question. Veuillez réessayer.';
    export const QUESTION_ALREADY_EXISTS = 'La question existe déjà. Veuillez changer le titre.';
    export const QUESTION_TITLE_EMPTY = "La question n'a pas de titre. Veuillez en ajouter un.";
    export const QUESTION_POINTS_INVALID = 'Le nombre de points doit être un multiple de 10 et comprise entre 10 et 100. Veuillez changer.';
    export const ANSWER_TEXT_EMPTY = 'Vous avez une ou plusieurs reponses vide. Veuillez réessayer.';
    export const WRONG_ANSWER_MISSING = "Il doit y avoir au moins 1 mauvaise réponse. Veuillez changer.";
    export const RIGHT_ANSWER_MISSING = "Il doit y avoir au moins 1 bonne réponse. Veuillez changer.";
    export const CHOICES_LENGTH_INVALID = 'Le nombre de choix doit être comprise entre 2 et 4. Veuillez changer.';
}
