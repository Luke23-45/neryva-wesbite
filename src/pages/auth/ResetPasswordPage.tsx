/**
 * `/reset-password` — password-reset request + token-confirm (P1-06).
 *
 * Top-level public route, like the invite page: emailed links land here
 * anonymously, so guarded shells (and their sign-in cards) must never wrap
 * it. All logic lives in ResetPasswordSection; this file is helmet + section.
 */
import { Helmet } from 'react-helmet-async';
import ResetPasswordSection from '@/sections/pages/auth/ResetPasswordSection';

export default function ResetPasswordPage() {
    return (
        <>
            <Helmet>
                <title>Reset your password — Neryva</title>
                <meta name="description" content="Reset your Neryva account password. Links expire 30 minutes after they are sent." />
                {/* The reset token rides `?token=` — it must never leak to
                    analytics/embeds via the Referer header. */}
                <meta name="referrer" content="no-referrer" />
            </Helmet>
            <ResetPasswordSection />
        </>
    );
}
