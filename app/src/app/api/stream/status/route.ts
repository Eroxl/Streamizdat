import { NextRequest, NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_URL = `redis://${REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : ''}${REDIS_HOST}:${REDIS_PORT}`;

// Singleton pattern with proper connection handling
let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

async function getRedisClient(): Promise<RedisClientType> {
    // Return existing connected client
    if (redisClient?.isOpen) {
        return redisClient;
    }


    // If connection is in progress, wait for it (prevents race condition)
    if (connectPromise) {
        return connectPromise;
    }

    // Create new connection
    connectPromise = (async () => {
        try {
            redisClient = createClient({ url: REDIS_URL });

            redisClient.on('error', (err: Error) => {
                console.error('Redis Client Error:', err);
                redisClient = null;
                connectPromise = null;
            });

            redisClient.on('end', () => {
                console.log('Redis connection closed');
                redisClient = null;
                connectPromise = null;
            });

            await redisClient.connect();
            return redisClient;
        } catch (error) {
            connectPromise = null;
            redisClient = null;
            throw error;
        }
    })();

    return connectPromise;
}

export async function GET(request: NextRequest) {
    try {
        const client = await getRedisClient();
        
        // Get the IS_ONLINE status from Redis
        const isOnline = await client.get('IS_ONLINE');
        
        return NextResponse.json({
            isOnline: isOnline === 'true',
            status: isOnline || 'unknown',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking stream status:', error);
        
        return NextResponse.json({
            isOnline: false,
            status: 'error',
            error: 'Unable to check stream status',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
