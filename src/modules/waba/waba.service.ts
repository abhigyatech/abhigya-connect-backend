import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { ConnectWabaInput } from './dto/connect-waba.input';

@Injectable()
export class WabaService {
    private readonly graphUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const version = this.configService.get<string>('META_GRAPH_VERSION', 'v22.0');
        this.graphUrl = `https://graph.facebook.com/${version}`;
    }

    async getAllByUser(userId: string) {
        return this.prisma.wabaIntegration.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async connectEmbeddedSignup(userId: string, input: ConnectWabaInput) {
        const appId = this.configService.get<string>('META_APP_ID');
        const appSecret = this.configService.get<string>('META_APP_SECRET');

        if (!appId || !appSecret) {
            throw new BadRequestException(
                'META_APP_ID and META_APP_SECRET must be configured in backend/.env',
            );
        }

        const tokenUrl = `${this.graphUrl}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${input.code}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token) {
            throw new BadRequestException(
                tokenData?.error?.message || 'Failed to exchange Meta authorization code',
            );
        }

        const accessToken = tokenData.access_token;

        const subscribeRes = await fetch(
            `${this.graphUrl}/${input.wabaId}/subscribed_apps`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

        if (!subscribeRes.ok) {
            const subErr = await subscribeRes.json();
            throw new BadRequestException(
                subErr?.error?.message || 'Failed to subscribe app webhooks to WABA',
            );
        }

        let phoneNumberId = input.phoneNumberId;
        if (!phoneNumberId) {
            const phoneListRes = await fetch(
                `${this.graphUrl}/${input.wabaId}/phone_numbers`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            );
            if (phoneListRes.ok) {
                const phoneListData = await phoneListRes.json();
                if (phoneListData?.data?.length > 0) {
                    phoneNumberId = phoneListData.data[0].id;
                }
            }
        }

        if (!phoneNumberId) {
            throw new BadRequestException('No Phone Number ID found for this WABA');
        }

        if (input.connectionType === 'EMBEDDED_FRESH') {
            await fetch(`${this.graphUrl}/${phoneNumberId}/register`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    pin: '123456',
                }),
            }).catch(() => null);
        }

        let phoneNumber = '';
        let businessName = 'WhatsApp Business';

        const phoneRes = await fetch(
            `${this.graphUrl}/${phoneNumberId}?fields=display_phone_number,verified_name`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

        if (phoneRes.ok) {
            const phoneData = await phoneRes.json();
            phoneNumber = phoneData.display_phone_number || '';
            businessName = phoneData.verified_name || 'WhatsApp Business';
        } else {
            phoneNumber = phoneNumberId;
        }

        return this.prisma.wabaIntegration.upsert({
            where: {
                userId_phoneNumberId: {
                    userId,
                    phoneNumberId,
                },
            },
            update: {
                wabaId: input.wabaId,
                phoneNumber,
                businessName,
                accessToken,
                connectionType: input.connectionType,
                isConnected: true,
            },
            create: {
                userId,
                wabaId: input.wabaId,
                phoneNumberId,
                phoneNumber,
                businessName,
                accessToken,
                connectionType: input.connectionType,
                isConnected: true,
            },
        });
    }

    async disconnect(userId: string, integrationId: string) {
        const existing = await this.prisma.wabaIntegration.findFirst({
            where: { id: integrationId, userId },
        });

        if (!existing) {
            throw new NotFoundException('WABA integration not found');
        }

        const otherNumbersInSameWaba = await this.prisma.wabaIntegration.count({
            where: {
                userId,
                wabaId: existing.wabaId,
                id: { not: integrationId },
            },
        });

        if (otherNumbersInSameWaba === 0) {
            await fetch(`${this.graphUrl}/${existing.wabaId}/subscribed_apps`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${existing.accessToken}` },
            }).catch(() => null);
        }

        await this.prisma.wabaIntegration.delete({
            where: { id: integrationId },
        });

        return true;
    }
}
