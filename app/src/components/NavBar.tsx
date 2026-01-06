import { cookies } from 'next/headers';
import Link from 'next/link';
import React from 'react';

const LoginButton: React.FC = () => {
    const cookiesList = cookies();
    const isLoggedIn = cookiesList.has('better-auth.session_token');

    if (isLoggedIn) {
        return (
            <Link href="/settings" className="p-2 hover:bg-white/5 rounded transition-colors duration-150">
                Account
            </Link>
        );
    }   

    return (
        <Link href="/login" className="p-2 hover:bg-white/5 rounded transition-colors duration-150">
            Login
        </Link>
    );
}

const NavBar: React.FC = () => {
    return (
        <nav className="flex items-center font-bold justify-between px-4 py-2 bg-nord-darker text-nord6 border-b border-nord2">
            <Link href="/" className="group p-2 rounded transition-colors font-mono duration-150 hover:bg-white/5">
                &lt;
                <span className="text-nord8">
                    eroxl
                </span>
                /&gt;
            </Link>
            <div className="flex gap-4">
                <Link href="/live" className='hover:bg-white/5 p-2 rounded transition-colors duration-150'>
                    Stream
                </Link>
                <Link 
                    href="https://github.com/eroxl/Streamizdat" target="_blank" rel="noopener noreferrer"
                    className='hover:bg-white/5 p-2 rounded transition-colors duration-150'
                >
                    Source Code
                </Link>
                <LoginButton />
            </div>
        </nav>
    );
}

export default NavBar;
