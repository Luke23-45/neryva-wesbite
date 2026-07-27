import { Helmet } from 'react-helmet-async';
import authData from '@neryva_data/auth/sections/auth.json';
import AuthSection from '@/sections/pages/auth/AuthSection';

export default function AuthPage() {
    return (
        <>
            <Helmet>
                <title>{authData.page.title}</title>
                <meta name="description" content={authData.page.description} />
            </Helmet>
            <AuthSection />

        </>
    );
}
