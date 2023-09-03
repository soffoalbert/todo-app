// todoist.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TodoistStrategy extends PassportStrategy(Strategy, 'todoist') {
  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: configService.get<string>('TODOIST_AUTHORIZATION_URL',"https://todoist.com/oauth/authorize?scope=data:read_write'"),
      tokenURL: configService.get<string>('TODOIST_TOKEN_URL','https://todoist.com/oauth/access_token'),
      clientID: configService.get<string>('TODOIST_CLIENT_ID','TODOIST_TOKEN_URL'),
      clientSecret: configService.get<string>('TODOIST_CLIENT_SECRET'),
      callbackURL: configService.get<string>('TODOIST_CALLBACK_URL',  'http://localhost:3000/todo/todoist/callback'), // Update with your callback URL
    } as StrategyOptions);
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return { accessToken, refreshToken, profile };
  }
}
