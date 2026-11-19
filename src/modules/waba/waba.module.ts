import { Module } from '@nestjs/common';
import { WabaService } from './waba.service';
import { WabaResolver } from './waba.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [WabaResolver, WabaService],
    exports: [WabaService],
})
export class WabaModule { }