import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import authData from '@neryva_data/auth/sections/auth.json';
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

    // Neryva Brand Mark
    const LogoMark = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="80" height="80">
            <defs>
                <linearGradient id="authWingUpper" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="authWingMiddle" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#00a8cc" />
                    <stop offset="60%" stopColor="#05e3a4" />
                    <stop offset="100%" stopColor="#00ff87" />
                </linearGradient>
                <linearGradient id="authWingLower" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="authObelisk" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#2e0854" />
                </linearGradient>
                <g id="authWing">
                    <polygon points="45,-280 340,-420 430,-420 260,-190 55,-95" fill="url(#authWingUpper)" />
                    <polygon points="26,-70 460,-110 450,-35 175,115 20,25" fill="url(#authWingMiddle)" />
                    <polygon points="14,55 310,240 245,305 55,395 14,325" fill="url(#authWingLower)" />
                </g>
            </defs>
            <g transform="translate(500,500)">
                <use href="#authWing" transform="scale(-1,1)" />
                <use href="#authWing" />
                <polygon points="0,-440 30,-290 30,-115 0,45 -30,-115 -30,-290" fill="url(#authObelisk)" />
            </g>
        </svg>
    );

    const d = authData.section;

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
                    <BrandMotif><LogoMark /></BrandMotif>
                    <AuthTitle>{d.title}</AuthTitle>
                    <AuthSub>{d.subtitle}</AuthSub>
                </motion.div>

                <FormBox onSubmit={handleNextStep}>

                    {/* Always Displayed */}
                    <motion.div layout>
                        <FieldGroup>
                            <LabelRow>
                                <Label>{d.email.label}</Label>
                                {authStep === 'initial' && <HelpLink type="button">{d.email.helpLink}</HelpLink>}
                            </LabelRow>
                            <Input
                                type="email"
                                placeholder={d.email.placeholder}
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
                                        <Label>{d.signup.firstName.label}</Label>
                                        <Input type="text" placeholder={d.signup.firstName.placeholder} required />
                                    </FieldGroup>
                                    <FieldGroup>
                                        <Label>{d.signup.lastName.label}</Label>
                                        <Input type="text" placeholder={d.signup.lastName.placeholder} required />
                                    </FieldGroup>
                                </NameSplit>

                                <FieldGroup>
                                    <LabelRow>
                                        <Label>{d.signup.password.label}</Label>
                                    </LabelRow>
                                    <Input type="password" placeholder={d.signup.password.placeholder} required />
                                </FieldGroup>

                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div layout style={{ marginTop: '8px', display: 'flex', flexDirection: 'column' }}>
                        <SubmitAction type="submit">
                            {authStep === 'initial' ? d.actions.connectTerminal : d.actions.initializeDirectory}
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
                                    <ArrowLeft size={16} /> {d.actions.backToConfig}
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
                    <a href={authData.footer.links[0].url}>{authData.footer.links[0].label}</a>
                    <a href={authData.footer.links[1].url}>{authData.footer.links[1].label}</a>
                </FooterLinks>
            </CellBotCenter>
            <CellBotRight />

        </ViewportGrid>
    );
}