// Constante pour le game management des lobbies
export const FIRST_QUESTION_INDEX = 0;
// Constante pour les lobbies
export const LOBBY_ID_LENGTH = 4;
export const BASE_10 = 10;
export const START_INDEX_SUBSTRING = 2;
export const END_INDEX_SUBSTRING = 3;
export const ORG_BANNED_NAME = 'organisateur';
export const LOBBY_IS_CLOSE = 'La session que vous tentez de rejoindre est fermée.';
export const LOBBY_NOT_EXISTING = 'La session que vous tentez de rejoindre est inexistante.';
export const ERROR_NAME_ALREADY_EXIST = 'Le nom du joueur existe déjà dans la session, veuillez en choisir un autre.';
export const ERROR_NAME_IS_BAN = 'Le nom du joueur est banni, veuillez en choisir un autre';
export const ERROR_NAME_CANT_BE_EMPTY = 'Le nom du joueur ne peut pas être vide.';
export const PERCENT = 100;

// Constantes pour les sockets
export enum SubscribeMessageType {
    CreateRoom = 'createRoom',
    CheckRoom = 'checkRoom',
    JoinRoom = 'joinRoom',
    StartGame = 'startGame',
    RequestRoomId = 'requestRoomId',
    RequestCurrentPlayers = 'requestCurrentPlayers',
    RequestName = 'requestName',
    LockLobby = 'lockLobby',
    LeaveLobby = 'leaveLobby',
    KickPlayer = 'kickPlayer',
    RetrieveGameId = 'retrieveGameId',
    FirstQuestion = 'firstQuestion',
    NextQuestion = 'nextQuestion',
    NextQuestionCountdown = 'nextQuestionCountdown',
    SubmitAnswerQcm = 'submitAnswerQcm',
    SubmitAnswerQrl = 'submitAnswerQrl',
    CorrectChoices = 'correctChoices',
    NewSelection = 'newSelection',
    NewDeselection = 'newDeselection',
    StarGameCountdown = 'startGameCountdown',
    Points = 'points',
    PlayersPoints = 'playersPoints',
    RetrieveLobbyScores = 'retrieveLobbyScores',
    RequestMessageHistory = 'requestMessageHistory',
    NewMessage = 'newMessage',
    NavigateToResults = 'navigateToResults',
    EvaluateNextPlayer = 'evaluateNextPlayer',
    EvaluateFirstPlayer = 'evaluateFirstPlayer',
    ModifyQuestion = 'modifyQuestion',
    PauseTimer = 'pauseTimer',
    UnpauseTimer = 'unpauseTimer',
    PanicMode = 'panicMode',
    Choices = 'choices',
    RetrieveChoicesHistory = 'retrieveChoicesHistory',
    RetrieveQuestions = 'retrieveQuestions',
    ToggleChatPermission = 'toggleChatPermission',
}
export enum EmitMessageType {
    RoomCreation = 'roomCreation',
    RoomJoining = 'roomJoining',
    ChooseNameError = 'chooseNameError',
    ValidName = 'validName',
    NewPlayer = 'newPlayer',
    Disconnected = 'disconnected',
    StartGame = 'startGame',
    RoomId = 'roomId',
    PlayerName = 'playerName',
    PlayerKicked = 'playerKicked',
    RetrieveGameId = 'retrieveGameId',
    PlayerDisconnected = 'playerDisconnected',
    Countdown = 'countdown',
    NewQuestion = 'newQuestion',
    CorrectChoices = 'correctChoices',
    EndGame = 'endGame',
    Wait = 'wait',
    NewSelection = 'newSelection',
    NewDeselection = 'newDeselection',
    ShowAnswer = 'showAnswer',
    Points = 'points',
    PlayersPoints = 'playersPoints',
    LobbyScores = 'lobbyScores',
    RoomMessages = 'roomMessages',
    NavigateToResults = 'navigateToResults',
    EvaluatePlayer = 'evaluatePlayer',
    Evaluating = 'evaluating',
    ModifyQuestion = 'modifyQuestion',
    PanicMode = 'panicMode',
    ChoicesHistory = 'choicesHistory',
    Questions = 'questions',
    PlayerSubmit = 'playerSubmit',
    ToggleChatPermission = 'toggleChatPermission',
}
// Constante pour les quiz
export const MINIMUM_TIME = 10;
export const MAXIMUM_TIME = 60;
export const NUMBER_CHOICE_MAX = 4;
export const NUMBER_CHOICE_MIN = 2;
export const POINTS_MIN = 10;
export const POINTS_MAX = 100;
export const QUESTION_MAX_LENGTH = 100;
export const STEP = 10;
export const TIMER_DELAY = 1000;
export const TIMER_DELAY_PANIC = 250;

export const BONUS = 0.2;

// Constante pour les erreurs de réponses Http
export enum ErrorType {
    ForbiddenDeleteQuestion = 'Le quiz ne peut pas ne pas avoir de question',
    BadRequestChoice = 'Les choix sont invalides, il faut au moins une bonne et une mauvaise réponse',
    BadRequestPoints = `Les points ne sont pas un multiple de ${STEP} ou il ne se trouve pas entre ${POINTS_MIN} et ${POINTS_MAX}`,
    BadRequestQuestion = "Il n'est pas possible de créer un jeu avec aucune question ",
    BadRequestIndexQuestion = "L'indice donné pour la question est invalide",
    BadRequestDurationQuestion = `La durée des questions doit se retrouver entre ${MINIMUM_TIME} et ${MAXIMUM_TIME} `,
    ForbiddenTitle = 'Le titre du quiz existe déjà dans la base de donnée. Veuillez en choisir un autre',
    NotFoundQuestions = "Le quiz pour ses questions n'existent plus dans la base de données",
    NotFoundQuestion = "Le quiz n'existe plus dans la base de données pour cette question",
    NotFoundModifyGame = 'La partie que vous essayez de modifier est introuvable',
    NotFoundDeleteGame = "La partie que vous tentez de supprimer n'est plus présente dans la base de données",
    NotFoundGame = 'Le quiz est introuvable dans la base de données',
    InternalServerError = 'Une erreur interne du serveur est survenue',
}
// Constante pour les code d'erreur de Http
export const ERROR_400 = [
    ErrorType.BadRequestChoice,
    ErrorType.BadRequestDurationQuestion,
    ErrorType.BadRequestIndexQuestion,
    ErrorType.BadRequestPoints,
    ErrorType.BadRequestQuestion,
];
export const ERROR_403 = [ErrorType.ForbiddenDeleteQuestion, ErrorType.ForbiddenTitle];
export const ERROR_404 = [
    ErrorType.NotFoundDeleteGame,
    ErrorType.NotFoundGame,
    ErrorType.NotFoundModifyGame,
    ErrorType.NotFoundQuestion,
    ErrorType.NotFoundQuestions,
];
// Constante pour le type de réponse de getGame()
export enum State {
    AdminPage,
    NormalPage,
    Export,
    CreateLobby,
}
// Constante pour le timer
export enum CountDown {
    GameStart = 5,
    NextQuestion = 3,
    QuestionTime,
    QuestionTimeQrl = 60,
}

// Constante pour le logger
export const logPlayerLeavingRoom = (playerName: string, room: string) => {
    return `${playerName} left the room ${room}`;
};

export const logSocketLeavingRoom = (id: string, room: string) => {
    return `${id} left the room ${room}`;
};

export const logRoomDestroy = (room: string) => {
    return `${room} was destroyed from the server`;
};

export const logClientDisconnectedFromServer = (id: string) => {
    return `Client: ${id} has disconnected from the server`;
};

export const logClientConnectedToServer = (id: string) => {
    return `Client: ${id} connected to the server`;
};

export const logRoomCreation = (roomId: string) => {
    return `The room: ${roomId} was created`;
};

export const logRoomJoining = (id: string, lobbyId: string) => {
    return `'The client ${id} joined the room ${lobbyId}`;
};
// Constante pour le type de questions
export enum QuestionType {
    QCM = 'QCM',
    QRL = 'QRL',
}
