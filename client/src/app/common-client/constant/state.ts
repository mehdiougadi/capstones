enum StateAdmin {
    DEFAULT,
    EDIT,
    DISPLAY,
    GAME,
}
enum StateHeader {
    HOME,
    ADMIN,
    CREATE,
    PlayerWait,
    HostWait,
    Resultats,
    GAME,
}

enum StateQuestionModal {
    NEW,
    EDIT,
    DISPLAY,
}

enum ContextQuestionModal {
    DEFAULT,
    QUIZ,
}

enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

export { ContextQuestionModal, MouseButton, StateAdmin, StateHeader, StateQuestionModal };
