import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
    @Query(() => String, { name: 'health' })
    checkHealth(): string {
        return 'ok';
    }
}