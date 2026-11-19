import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FastifyReply, FastifyRequest } from 'fastify';
import { join } from 'path';
import { DatabaseModule } from './core/database/database.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './core/health/health.module';
import { WabaModule } from './modules/waba/waba.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/core/graphql/schema.gql'),
      sortSchema: true,
      playground: false,
      introspection: process.env.NODE_ENV !== 'production',
      context: ({
        request,
        reply,
      }: {
        request: FastifyRequest;
        reply: FastifyReply;
      }) => ({ request, reply }),
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    UsersModule,
    HealthModule,
    WabaModule,
  ],
})
export class AppModule { }