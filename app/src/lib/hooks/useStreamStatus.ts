'use client';

import { useState, useEffect } from 'react';

export interface StreamStatus {
    isOnline: boolean;
    status: string;
    timestamp: string;
    error?: string;
}

export function useStreamStatus(intervalMs: number = 5000) {
    const [status, setStatus] = useState<StreamStatus>({
        isOnline: false,
        status: 'loading',
        timestamp: new Date().toISOString()
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/stream/status');
                const data: StreamStatus = await response.json();
                setStatus(data);
            } catch (error) {
                console.error('Error fetching stream status:', error);
                setStatus({
                    isOnline: false,
                    status: 'error',
                    error: 'Failed to fetch status',
                    timestamp: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        // Fetch immediately
        fetchStatus();

        // Set up polling
        const interval = setInterval(fetchStatus, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return { status, loading };
}
