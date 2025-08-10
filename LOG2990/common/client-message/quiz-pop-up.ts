export namespace QuizMessage {
    export const CREATE_QUIZ_SUCCESS = 'Vous avez créé le quiz avec succès.';
    export const MODIFY_QUIZ_SUCCESS = 'Vous avez modifié le quiz avec succès.';
    export const DELETE_QUIZ_SUCCESS = 'Vous avez supprimé le quiz avec succès.';
    export const DELETE_QUIZ_FAIL = "Erreur lors de la suppression de le quiz. Le quiz n'existe pas.";
    export const QUIZ_ALREADY_EXISTS = 'Le quiz existe déjà. Veuillez changer le titre.';
    export const QUIZ_TITLE_EMPTY = "Il vous manque un titre et/ou une description. Veuillez en ajouter.";
    export const QUIZ_NO_QUESTIONS = "Il vous manque des questions. Veuillez en ajouter.";
    export const QUIZ_DURATION_INVALID = 'La duree doit être comprise entre 10s et 60s. Veuillez changer.';
}