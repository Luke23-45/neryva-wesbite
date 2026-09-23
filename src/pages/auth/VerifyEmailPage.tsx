/**
 * `/verify-email` — email-verification confirmation (P1-06).
 *
 * Top-level public route, like the invite page: emailed links land here
 * anonymously, so guarded shells (and their sign-in cards) must never wrap
 * it. All logic lives in VerifyEmailSection; this file is helmet + section.
 */
import { Helmet } from 'react-helmet-async';
import VerifyEmailSection from '@/sections/pages/auth/VerifyEmailSection';

export default function VerifyEmailPage() {
    return (
        <>
            <Helmet>
                <title>Verify your email — Neryva</title>
                <meta name="description" content="Confirm your Neryva account email address." />
                {/* The verification token rides `?token=` — it must never leak
                    to analytics/embeds via the Referer header. */}
                <meta name="referrer" content="no-referrer" />
            </Helmet>
            <VerifyEmailSection />
        </>
    );
}
