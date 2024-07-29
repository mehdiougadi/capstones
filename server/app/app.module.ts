import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { QuizController } from '@app/controllers/quiz/quiz.controller';
import { Quiz } from '@app/model/database/quiz';
import { quizSchema } from '@app/model/schema/quiz/quiz.schema';
import { QuizDbService } from '@app/services/quiz-service/quiz.service';

import { Answer } from '@app/model/database/answer';
import { answerSchema } from '@app/model/schema/answer/answer.schema';
import { AnswerDbService } from '@app/services/answer-service/answer.service';

import { QuestionController } from '@app/controllers/question/question.controller';
import { Question } from '@app/model/database/question';
import { questionSchema } from '@app/model/schema/question/question.schema';
import { QuestionDbService } from '@app/services/question-service/question.service';

import { AdminController } from './controllers/admin/admin.controller';
import { Admin, adminSchema } from './model/schema/admin/admin.schema';
import { AdminService } from './services/admin-service/admin.service';

import { GameHistoryController } from './controllers/game-history/game-history.controller';
import { RoomController } from './controllers/room/room.controller';
import { GameConnectionGateway } from './gateways/game-connection/game-connection.gateway';
import { PlayerConnectionGateway } from './gateways/player-connection/player-connection.gateway';
import { PlayerTrackerGateway } from './gateways/player-tracker/player-tracker.gateway';
import { TimerGateway } from './gateways/timer/timer.gateway';
import { UpdateStatsGateway } from './gateways/update-stats-gateway/update-stats.gateway';
import { GameHistory, gameHistorySchema } from './model/database/game-history';
import { Room, roomSchema } from './model/schema/room/room.schema';
import { GameHistoryDbService } from './services/game-history/game-history.service';
import { GameService } from './services/game-services/game-main-Service/game-main.service';
import { GameServicePlayer } from './services/game-services/game-player-Service/game-player-service';
import { GameServiceRoom } from './services/game-services/game-room-service/game-room-service';
import { GameServiceState } from './services/game-services/game-state-service/game-state-service';
import { GameServiceTimer } from './services/game-services/game-timer-service/game-timer-service';
import { VerificationService } from './services/verification-service/verification.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([{ name: Quiz.name, schema: quizSchema }]),
        MongooseModule.forFeature([{ name: Answer.name, schema: answerSchema }]),
        MongooseModule.forFeature([{ name: Question.name, schema: questionSchema }]),
        MongooseModule.forFeature([{ name: Admin.name, schema: adminSchema }]),
        MongooseModule.forFeature([{ name: Room.name, schema: roomSchema }]),
        MongooseModule.forFeature([{ name: GameHistory.name, schema: gameHistorySchema }]),
    ],
    controllers: [QuizController, QuestionController, AdminController, RoomController, GameHistoryController],
    providers: [
        ChatGateway,
        Logger,
        QuizDbService,
        QuestionDbService,
        AnswerDbService,
        AdminService,
        GameService,
        PlayerConnectionGateway,
        VerificationService,
        GameConnectionGateway,
        PlayerTrackerGateway,
        TimerGateway,
        GameServicePlayer,
        GameServiceState,
        GameServiceTimer,
        GameServiceRoom,
        UpdateStatsGateway,
        GameHistoryDbService,
    ],
})
export class AppModule {}
