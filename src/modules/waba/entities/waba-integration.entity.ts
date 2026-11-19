import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WabaConnectionType } from '../dto/connect-waba.input';

@ObjectType()
export class WabaIntegration {
    @Field(() => ID)
    id: string;

    @Field()
    wabaId: string;

    @Field()
    phoneNumberId: string;

    @Field()
    phoneNumber: string;

    @Field()
    businessName: string;

    @Field(() => WabaConnectionType)
    connectionType: WabaConnectionType;

    @Field()
    isConnected: boolean;

    @Field()
    createdAt: Date;
}