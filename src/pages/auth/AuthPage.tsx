import { Helmet } from 'react-helmet-async';
import LoginSection from '@/sections/pages/auth/LoginSection';

export default function AuthPage() {
    return (
        <>
            <Helmet>
                <title>Sign in — Neryva</title>
                <meta name="description" content="Sign in to Neryva — one account for everything you build here. New accounts are created automatically on first sign-in." />
            </Helmet>
            <LoginSection />

        </>
    );
}
