import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const gqlReq = gqlCtx.getContext()?.req || gqlCtx.getContext()?.request;
    const request = gqlReq || ctx.switchToHttp().getRequest();
    const user = request?.user;
    return data ? user?.[data] : user;
  },
);
