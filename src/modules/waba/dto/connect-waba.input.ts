import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum WabaConnectionType {
    EMBEDDED_COEXISTENCE = 'EMBEDDED_COEXISTENCE',
    EMBEDDED_FRESH = 'EMBEDDED_FRESH',
}

registerEnumType(WabaConnectionType, {
    name: 'WabaConnectionType',
});

@InputType()
export class ConnectWabaInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    code: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    wabaId: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    phoneNumberId: string;

    @Field(() => WabaConnectionType)
    @IsEnum(WabaConnectionType)
    connectionType: WabaConnectionType;
}