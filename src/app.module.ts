import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesModule } from './roles/roles.module';
import { UserModule } from './user/user.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { MailModule } from './services/mail.module';
import config from './config/config';

@Module({
  imports: [
    // Config Module setup
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),

    // JWT Module setup
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '10h'),
        },
      }),
      global: true,
      inject: [ConfigService],
    }),

    // MongoDB setup
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.connectionString'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    RolesModule,
    UserModule,
    MentorshipModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}