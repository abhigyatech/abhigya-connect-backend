import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WabaService } from './waba.service';
import { WabaIntegration } from './entities/waba-integration.entity';
import { ConnectWabaInput } from './dto/connect-waba.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => WabaIntegration)
@UseGuards(JwtAuthGuard)
export class WabaResolver {
    constructor(private readonly wabaService: WabaService) { }

    @Query(() => [WabaIntegration])
    async wabaIntegrations(@CurrentUser() user: { id: string }) {
        return this.wabaService.getAllByUser(user.id);
    }

    @Mutation(() => WabaIntegration)
    async connectWaba(
        @CurrentUser() user: { id: string },
        @Args('input') input: ConnectWabaInput,
    ) {
        return this.wabaService.connectEmbeddedSignup(user.id, input);
    }

    @Mutation(() => Boolean)
    async disconnectWaba(
        @CurrentUser() user: { id: string },
        @Args('id', { type: () => ID }) id: string,
    ) {
        return this.wabaService.disconnect(user.id, id);
    }
}