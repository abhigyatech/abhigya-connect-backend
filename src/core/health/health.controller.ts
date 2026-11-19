import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
    @Get()
    check() {
        return {
            status: 'ok',
            service: 'abhigya-connect-api',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        };
    }
}