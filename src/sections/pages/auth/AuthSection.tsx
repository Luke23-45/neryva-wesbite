import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
    ViewportGrid,
    CellTopLeft,
    CellTopCenter,
    CellTopRight,
    CellMidLeft,
    ConsoleStage,
    CellMidRight,
    CellBotLeft,
    CellBotCenter,
    FooterLinks,
    CellBotRight,
    BrandMotif,
    AuthTitle,
    AuthSub,
    FormBox,
    FieldGroup,
    NameSplit,
    LabelRow,
    Label,
    HelpLink,
    Input,
    SubmitAction,
    BackAction
} from './AuthSection.styles';

export default function AuthSection() {
    const [authStep, setAuthStep] = useState<'initial' | 'signup'>('initial');
    const [email, setEmail] = useState('');

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (authStep === 'initial' && email.includes('@')) {
            setAuthStep('signup');
        } else if (authStep === 'signup') {
            // Execute true final sign up architecture calls here
            console.log('Final Execution Payload Fired');
        }
    };

    const handleBack = () => {
        setAuthStep('initial');
    };

    // Neryva Abstract Building Block Grid (Matching the specific block shape vibe natively in SVG)
    const MotifMatrix = () => (
        <svg viewBox="0 0 32 32" fill="currentColor">
            <path d="M4 20v8h8v-8H4zM12 12v8h8v-8h-8zM20 20v8h8v-8h-8z" />
        </svg>
    );

    const transitionConfig = {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
    };

    return (
        <ViewportGrid>
            {/* ── ROW 1 ── */}
            <CellTopLeft />
            <CellTopCenter />
            <CellTopRight />

            {/* ── ROW 2 (Core Layer) ── */}
            <CellMidLeft />

            {/* Console dynamically scales based on internal array dimensions utilizing `layout` tracking prop */}
            <ConsoleStage as={motion.div} layout>

                <motion.div layout>
                    <BrandMotif><MotifMatrix /></BrandMotif>
                    <AuthTitle>Authenticate access.</AuthTitle>
                    <AuthSub>Provide authorized credentials to initialize session.</AuthSub>
                </motion.div>

                <FormBox onSubmit={handleNextStep}>

                    {/* Always Displayed */}
                    <motion.div layout>
                        <FieldGroup>
                            <LabelRow>
                                <Label>Email configuration</Label>
                                {authStep === 'initial' && <HelpLink type="button">Lost credential map?</HelpLink>}
                            </LabelRow>
                            <Input
                                type="email"
                                placeholder="directory@example.com"
                                required
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={authStep === 'signup'}
                            />
                        </FieldGroup>
                    </motion.div>

                    {/* Expanded Step Fields */}
                    <AnimatePresence>
                        {authStep === 'signup' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={transitionConfig}
                                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >

                                <NameSplit>
                                    <FieldGroup>
                                        <Label>First signature</Label>
                                        <Input type="text" placeholder="Access name" required />
                                    </FieldGroup>
                                    <FieldGroup>
                                        <Label>Last signature</Label>
                                        <Input type="text" placeholder="Verification string" required />
                                    </FieldGroup>
                                </NameSplit>

                                <FieldGroup>
                                    <LabelRow>
                                        <Label>Access token</Label>
                                    </LabelRow>
                                    <Input type="password" placeholder="Create strong terminal key" required />
                                </FieldGroup>

                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div layout style={{ marginTop: '8px', display: 'flex', flexDirection: 'column' }}>
                        <SubmitAction type="submit">
                            {authStep === 'initial' ? 'Connect terminal →' : 'Initialize directory creation'}
                        </SubmitAction>

                        {/* The conditional retreat action bounds */}
                        <AnimatePresence>
                            {authStep === 'signup' && (
                                <BackAction
                                    type="button"
                                    onClick={handleBack}
                                    as={motion.button}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={transitionConfig}
                                >
                                    <ArrowLeft size={16} /> Re-target connection configuration
                                </BackAction>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </FormBox>
            </ConsoleStage>

            <CellMidRight />

            {/* ── ROW 3 ── */}
            <CellBotLeft />
            <CellBotCenter>
                <FooterLinks>
                    <a href="#">Security compliance framework</a>
                    <a href="#">Operations boundary policy</a>
                </FooterLinks>
            </CellBotCenter>
            <CellBotRight />

        </ViewportGrid>
    );
}