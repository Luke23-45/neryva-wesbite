import { Helmet } from 'react-helmet-async';
import AuthSection from '@/sections/pages/auth/AuthSection';

export default function AuthPage() {
    return (
        <>
            <Helmet>
                <title>Auth</title>
                <meta name="description" content="Auth Page" />
            </Helmet>
            <AuthSection />

        </>
    );
}
