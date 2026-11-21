import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const gqlReq = gqlCtx.getContext()?.req || gqlCtx.getContext()?.request;
    const httpReq = context.switchToHttp().getRequest();
    const request = gqlReq || httpReq;

    if (!request || !request.headers) {
      throw new UnauthorizedException('Request context unavailable');
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'abhigya_connect_super_jwt_secret_key_2026';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      request.user = {
        ...payload,
        id: payload.sub || payload.id,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }
}
