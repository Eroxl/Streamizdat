'use server';

import { createClient } from 'redis';

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`;

export interface StreamStatus {
    isOnline: boolean;
    status: string;
    timestamp: string;
    error?: string;
}

export async function getStreamStatus(): Promise<StreamStatus> {
    let redisClient;

    try {
        // Create a new Redis client for each request
        redisClient = createClient({
            url: REDIS_URL
        });

        redisClient.on('error', (err: Error) => console.log('Redis Client Error', err));

        await redisClient.connect();

        // Get the IS_ONLINE status from Redis
        const isOnline = await redisClient.get('IS_ONLINE');

        return {
            isOnline: isOnline === 'true',
            status: isOnline || 'unknown',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error checking stream status:', error);

        return {
            isOnline: false,
            status: 'error',
            error: 'Unable to check stream status',
            timestamp: new Date().toISOString()
        };
    } finally {
        // Clean up the Redis connection
        if (redisClient) {
            try {
                await redisClient.disconnect();
            } catch (disconnectError) {
                console.error('Error disconnecting from Redis:', disconnectError);
            }
        }
    }
}
