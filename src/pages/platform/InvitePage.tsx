/**
 * `/platform/invites/:inviteId` — invite acceptance (first-run ledger F2).
 *
 * Top-level public route: anonymous visitors must see the preview before any
 * sign-in, so no guarded shell wraps this page. All logic lives in
 * InviteSection; this file is helmet + section.
 */
import { Helmet } from 'react-helmet-async';
import { InviteSection } from '@/sections/pages/platform/invite';

export default function InvitePage() {
    return (
        <>
            <Helmet>
                <title>Workspace invitation — Neryva</title>
                <meta name="description" content="Accept your invitation and join a Neryva workspace." />
                {/* Team-loop T2-5: the invite token rides `?token=` — it must never
                    leak to analytics/embeds via the Referer header. */}
                <meta name="referrer" content="no-referrer" />
            </Helmet>
            <InviteSection />
        </>
    );
}
