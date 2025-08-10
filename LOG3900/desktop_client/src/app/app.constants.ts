// Constante titre
export const APP_TITLE = 'Brain Clash';

// Constante pour les lobbies
export const LOBBY_ID_LENGTH = 4;
export const PANIC_MODE_TIME_LIMIT_QCM = 10;
export const PANIC_MODE_TIME_LIMIT_QRL = 20;

// Constante chat
export const MAX_LENGTH_MESSAGE = 200;
export const FORBIDDEN_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

// Constante pour les questions bonus
export const MULTIPLIER = 1.2;

// Nom organisateur
export const ORG_NAME = 'Organisateur';

// pop up messages
export const POPUP_WARNING = 'Avertissement';
export const CONGRATULATION = 'Félicitation!';
export const POPUP_ERROR = 'Erreur';
export const POPUP_CONFIRM = 'Confirmation';
export const SYSTEM_ERROR = 'Erreur système';
export const ERROR_OCCURRED = "Une erreur s'est produite.";
export const DISCONNECTED_POPUP = 'Vous avez été déconnecté de la partie.';
export const ORGANIZER_LEFT_POPUP = "L'organisateur a quitté la partie.";
export const ERROR_NO_TIME_ENTER_NAME = "La partie a commencé avant que vous n'ayez entré votre nom.";
export const WARNING_KICKED_PLAYER = 'Vous avez été expulsé de la session.';
export const LOCK_GAME_BEFORE_START = 'Veuillez verrouiller la partie avant de débuter.';
export const DISCONNECTED_EMPTY_ROOM = 'Vous avez été déconnecté de la partie, car tous les joueurs ont quitté.';
export const SUCCESS_QUIZ_CREATION = 'Votre quiz a été créé avec succès!';
export const SUCCESS_QUIZ_MODIFICATION = 'Votre quiz a été modifié avec succès!';
export const ERROR_ROOM_CODE_LENGTH = 'Le code du lobby doit être de 4 chiffres.';
export const BAD_ENTRY = 'Entrée non valide: ';
export const FORMAT_ERROR = 'Erreur de format';
export const IMPORT_SUCCESS = 'Votre nouveau jeu a bien été importé.';
export const NO_PLAYER = "Aucun joueur n'est dans la partie.";
export const ARE_YOU_SURE = 'Êtes-vous bien sûr de vouloir supprimer?';
export const ERROR_DOWNLOAD_HISTORY = "Une erreur s'est produite lors du téléchargement de l'historique ";
export const ERROR_DELETE_HISTORY = "Une erreur s'est produite à la suppression de l'historique ";
// Constante pour admin
export const PASSWORD_ERROR = 'Mot de passe incorrect, veuillez réessayer';

// Constante pour les questions
export const BONUS_MESSAGE = 'Vous avez obtenu un bonus de 20% sur votre réponse!';

// Constante pour le pourcentage  maximum de l'histogramme
export const MAX_PERCENTAGE = 100;

// Constante pour le count initial de chaque choix de l'histogramme
export const INITIAL_COUNT = 0;
// Constante pour la longueur du texte en anglais
export const ENGLISH_TEXT_LENGTH = 18;
// Constante pour les sockets
export enum SocketServerEventsSend {
    CreateRoom = 'createRoom',
    CheckRoom = 'checkRoom',
    JoinRoom = 'joinRoom',
    StartGame = 'startGame',
    FirstQuestion = 'firstQuestion',
    NextQuestion = 'nextQuestion',
    CorrectChoices = 'correctChoices',
    RequestRoomId = 'requestRoomId',
    RequestCurrentPlayers = 'requestCurrentPlayers',
    RequestName = 'requestName',
    LockLobby = 'lockLobby',
    StartGameCountdown = 'startGameCountdown',
    NextQuestionCountdown = 'nextQuestionCountdown',
    LeaveLobby = 'leaveLobby',
    KickPlayer = 'kickPlayer',
    RetrieveGameId = 'retrieveGameId',
    NewMessage = 'newMessage',
    SubmitAnswerQcm = 'submitAnswerQcm',
    SubmitAnswerQrl = 'submitAnswerQrl',
    NavigateToResults = 'navigateToResults',
    Points = 'points',
    PlayersPoints = 'playersPoints',
    RetrieveLobbyScores = 'retrieveLobbyScores',
    NewSelection = 'newSelection',
    NewDeselection = 'newDeselection',
    RequestMessageHistory = 'requestMessageHistory',
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

export enum SocketClientEventsListen {
    RoomJoining = 'roomJoining',
    ChooseNameError = 'chooseNameError',
    NewPlayer = 'newPlayer',
    StartGame = 'startGame',
    NewQuestion = 'newQuestion',
    Countdown = 'countdown',
    AllSubmitted = 'allSubmitted',
    CorrectChoices = 'correctChoices',
    NewSelection = 'newSelection',
    NewDeselection = 'newDeselection',
    RoomCreation = 'roomCreation',
    RoomId = 'roomId',
    PlayerName = 'playerName',
    Disconnected = 'disconnected',
    PlayerDisconnected = 'playerDisconnected',
    PlayerKicked = 'playerKicked',
    RetrieveGameId = 'retrieveGameId',
    ValidName = 'validName',
    RoomMessages = 'roomMessages',
    EndGame = 'endGame',
    NextQuestion = 'nextQuestion',
    ShowAnswer = 'showAnswer',
    NavigateToResults = 'navigateToResults',
    Points = 'points',
    PlayersPoints = 'playersPoints',
    LobbyScores = 'lobbyScores',
    EvaluatePlayer = 'evaluatePlayer',
    Evaluating = 'evaluating',
    ModifyQuestion = 'modifyQuestion',
    PanicMode = 'panicMode',
    ChoicesHistory = 'choicesHistory',
    Questions = 'questions',
    PlayerSubmit = 'playerSubmit',
    ToggleChatPermission = 'toggleChatPermission',
}

// Constantes pour les erreurs HTTP
export enum ErrorType {
    ForbiddenDeleteQuestion = 'Quiz cannot have no question.',
    BadRequestChoice = 'les choix sont invalides, il faut au moins une bonne et une mauvaise réponse',
    BadRequestPoints = 'les points ne sont pas un multiple de 10 ou il ne se trouve pas entre 10 et 100',
    BadRequestQuestion = "il n'est pas possible de créer un jeu avec aucune question ",
    BadRequestIndexQuestion = "l'indice donné pour la question est invalide",
    BadRequestDurationQuestion = 'la durée des questions doit se retrouver entre 10 et 60',
    ForbiddenTitle = 'Le titre du quiz existe déjà dans la base de donnée. Veuillez en choisir un autre',
    NotFoundQuestions = "Le quiz pour ses questions n'existent plus dans la base de données",
    NotFoundQuestion = "Le quiz n'existe plus dans la base de données pour cette question",
    NotFoundModifyGame = 'La partie que vous essayez de modifier est introuvable',
    NotFoundDeleteGame = "La partie que vous tentez de supprimer n'est plus présente dans la base de données",
    NotFoundGame = 'Le quiz est introuvable dans la base de données',
    InternalServerError = 'Une erreur interne du serveur est survenue',
}

export enum GameState {
    Collapsed = 'collapsed',
    Expanded = 'expanded',
}

export enum QuestionState {
    Submitted = 'submitted',
    ShowAnswers = 'showAnswers',
    InQuestion = 'inQuestion',
    Evaluating = 'evaluating',
    StartingNextQuestion = 'startingNextQuestion',
}

export enum PlayerState {
    NoInteraction = 'noInteraction',
    FirstInteraction = 'firstInteraction',
    Confirmation = 'confirmation',
    Abandoned = 'abandoned',
}

export enum GameMode {
    Player = 'player',
    Test = 'test',
}

export enum SortBy {
    Points = 'points',
    Name = 'name',
    State = 'state',
}
// Constante Carousel
export const NB_GAMES_PER_PAGE = 4;

// Constante Creation Question
export const MINIMUM_POINTS_VALUE = 10;
export const MAXIMUM_POINTS_VALUE = 100;
export const LIMIT_TOP_VALUE = 120;
export const ROUNDED_POINTS_ENTRY = 60;
export const POINTS_ENTRY = 55;
export const LIMIT_BOTTOM_VALUE = -10;
export const INVALID = -1;
export const STEP = 10;

export enum Status {
    Start,
    UpdateAccept,
    UpdateRefuse,
}

// Constante Modification Jeu
export const MAX_LENGTH_DESCRIPTION = 300;
export const MAX_LENGTH_INPUT = 60;
export const MAX_LENGTH_TEXT = 100;
export const MIN_LENGTH_INPUT = 10;
export const MIN_POINTS = 10;

// Constante pour les routes
export enum Routes {
    Empty = '',
    Home = '/home',
    Game = '/game',
    Administration = '/administration',
    AdministrationLogin = '/administrationLogin',
    Creation = '/creation',
    CreateQuiz = '/createQuiz',
    GameOrganizer = '/gameOrganizerView',
    Lobby = '/lobby',
    Results = '/results',
}

// Constante pour le url du serveur
import { environment } from 'src/environments/environment';
export const API_URL_AUTH = environment.serverUrl + 'api/auth';
export const API_URL_GAME = environment.serverUrl + 'api/game';
// Constante pour le type de questions
export enum QuestionType {
    QCM = 'QCM',
    QRL = 'QRL',
}

export enum QuestionPoints {
    NoPoints = 0,
    HalfPoints = 50,
    AllPoints = 100,
}

export enum ChipColor {
    Warn = 'warn',
    Accent = 'accent',
    Primary = 'primary',
}

export const API_URL_HISTORY = environment.serverUrl + 'api/history';
// Constante pour le temps de modification de QRL
export const ONE_SECOND = 1000;
export const FIVE_SECOND = 5;

export const MODIFYING = 0;
export const NOT_MODIFYING = 1;

// Constante pour les classes de fleches
export const ARROW_UP = 'arrow-up';
export const ARROW_DOWN = 'arrow-down';

// Constante pour les modifications des qrl
export const MODIFY = 'Modifié';
export const NOT_MODIFY = 'Non modifié';

// Constantes pour le file service
export const REQUIRED_PROP = 'La propriété suivante est requise: ';
export const ENTER_GAME_TITLE = 'Entrez le titre du jeu: ';
