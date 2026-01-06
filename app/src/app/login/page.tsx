"use client";

import { authClient } from "@/lib/authClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PROVIDERS = ['Google', 'GitHub', 'Twitch', 'TikTok'] as const;
const PROVIDER_ICONS: Record<typeof PROVIDERS[number], string> = {
    Google: '/icons/google.svg',
    GitHub: '/icons/github.svg',
    Twitch: '/icons/twitch.svg',
    TikTok: '/icons/tiktok.svg',
};

const OAuthButton: React.FC<{ provider: typeof PROVIDERS[number] }> = ({ provider }) => {
    return (
        <button
            className="flex items-center gap-2 w-96 justify-center p-2 h-12 font-bold border rounded-md hover:bg-white/5 transition duration-150"
            onClick={async () => {
                authClient.signIn.social({
                    provider: provider.toLowerCase() as string,
                    callbackURL: '/live/',
                });
            }}
        >
            <Image
                src={PROVIDER_ICONS[provider]}
                className="w-6 h-6 aspect-square"
                alt={`${provider} icon`}
                width={20}
                height={20}
            />
            Continue with {provider}
        </button>
    );
};

const cleanupUsername = (username: string) => {
    return username.replaceAll(/[^a-zA-Z0-9-_]/g, '');
}

const AuthModalForm: React.FC<{
    type: 'login' | 'signup',
    onSubmit: (
        username: string,
        password: string,
        setError: (error: string | null) => void
    ) => void,
}> = ({ type, onSubmit }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState<string | null>(null);

    return (
        <form
            className="flex flex-col gap-4 mt-4"
            onSubmit={(e) => {
                e.preventDefault();

                if (username !== cleanupUsername(username)) {
                    setError('Username contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.');
                    return;
                }

                onSubmit(cleanupUsername(username), password, setError);
            }}
        >
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-nord10"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-nord10"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                className="p-2 bg-nord10/90 text-white rounded-md hover:bg-nord10 transition duration-150"
            >
                {type === 'login' ? 'Login' : 'Signup'}
            </button>
        </form>
    );
}

const LoginModal = () => {
    const router = useRouter();

    const onSubmit = async (username: string, password: string, setError: (error: string | null) => void) => {
        const { data, error } = await authClient.signIn.username({
            username,
            password,
            callbackURL: '/live/',
        });

        console.log(error);

        if (error) {
            setError(error.message || 'An unknown error occurred during login.');
            return;
        }

        router.push('/live/');
    };

    return (
        <div className="w-96">
            <h2 className="text-2xl font-bold">Login</h2>

            <AuthModalForm type="login" onSubmit={onSubmit} />
        </div>
    );
            
};

const SignupModal: React.FC = () => {
    const router = useRouter();

    const onSubmit = async (username: string, password: string, setError: (error: string | null) => void) => {
        const { data, error } = await authClient.signUp.email({
            email: `${username}@anonymouse.streamizdat.com`,
            name: username,
            password: password,
            callbackURL: '/live/',
        });

        if (error) {
            setError(error.message || 'An unknown error occurred during signup.');
            return;
        }

        router.push('/live/');
    }

    return (
        <div className="w-96">
            <h2 className="text-2xl font-bold">Signup</h2>

            <AuthModalForm type="signup" onSubmit={onSubmit} />
        </div>
    );
};

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            {isLogin ? <LoginModal /> : <SignupModal />}

            <br />

            <div className="flex flex-col gap-2">
                {PROVIDERS.map((provider) => (
                    <OAuthButton key={provider} provider={provider} />
                ))}
            </div>
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Switch to Signup' : 'Switch to Login'}
            </button>
        </div>
    );
}
