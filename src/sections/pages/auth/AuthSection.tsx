import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import authData from '@neryva_data/auth/sections/auth.json';
import { useAuthMutation } from '@/hooks/mutations/useAuthMutation';
import { useAuthStore } from '@/store/authStore';
import {
    AuthWrapper,
    ConsoleStage,
    FooterBar,
    FooterLinks,
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
    BackAction,
    ToggleMode,
    VerifyIcon,
    VerifyTextRow,
    ResendAction,
    OtpInput,
} from './AuthSection.styles';

export default function AuthSection() {
    const navigate = useNavigate();
    const authMutation = useAuthMutation();
    const { isAuthenticated, user, setUser } = useAuthStore();

    const [authStep, setAuthStep] = useState<'initial' | 'signup' | 'login' | 'verify'>('initial');
    const [mode, setMode] = useState<'signup' | 'login'>('signup');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    useEffect(() => {
        if (isAuthenticated && authStep !== 'verify') {
            navigate({ to: '/' });
        }
    }, [isAuthenticated, authStep, navigate]);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (authStep === 'initial' && email.includes('@')) {
            if (mode === 'login') {
                setAuthStep('login');
            } else {
                setAuthStep('signup');
            }
        } else if (authStep === 'signup') {
            setIsSigningUp(true);
            setTimeout(() => {
                setIsSigningUp(false);
                setAuthStep('verify');
                setOtp('');
            }, 3500);
        } else if (authStep === 'login') {
            authMutation.mutate(
                { type: 'LOGIN', payload: { email, password }, remember: true },
                { onSuccess: () => { navigate({ to: '/' }); } },
            );
        }
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        authMutation.mutate(
            { type: 'VERIFY_OTP', payload: { email, otp, purpose: 'email_verification' } },
            {
                onSuccess: () => {
                    if (user) {
                        setUser({ ...user, status: 'active' });
                    }
                    navigate({ to: '/' });
                },
            },
        );
    };

    const handleResendOtp = () => {
        authMutation.mutate({ type: 'SEND_OTP', payload: { email, purpose: 'email_verification' } });
    };

    const handleBack = () => {
        if (authStep === 'signup' || authStep === 'login') {
            setAuthStep('initial');
        }
    };

    const toggleAuthMode = () => {
        setMode(mode === 'signup' ? 'login' : 'signup');
        setAuthStep('initial');
    };

    const LogoMark = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="70" height="70">
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
        <AuthWrapper>
            <ConsoleStage as={motion.div} layout>
                <AnimatePresence mode="wait">

                    {authStep === 'verify' ? (
                        <motion.div
                            key="auth-verify"
                            initial={{ opacity: 0, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ ...transitionConfig, delay: 0.1 }}
                            style={{ textAlign: 'center' }}
                        >
                            <VerifyIcon style={{ margin: '0 auto 32px' }}>
                                <Mail />
                            </VerifyIcon>

                            <AuthTitle>{d.verify.title}</AuthTitle>
                            <VerifyTextRow>
                                {d.verify.description} <br />
                                <strong>{email}</strong>
                            </VerifyTextRow>

                            <FormBox onSubmit={handleVerifyOtp} style={{ alignItems: 'center', width: '100%' }}>
                                <FieldGroup style={{ alignItems: 'center' }}>
                                    <Label>Verification code</Label>
                                    <OtpInput
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                </FieldGroup>
                                <SubmitAction type="submit" disabled={otp.length !== 6}>
                                    Verify
                                </SubmitAction>
                            </FormBox>

                            <VerifyTextRow style={{ margin: '16px 0 0', fontSize: '14px' }}>
                                {d.verify.noEmailText}{' '}
                                <ResendAction type="button" onClick={handleResendOtp}>
                                    {d.verify.resendText}
                                </ResendAction>
                            </VerifyTextRow>
                        </motion.div>

                    ) : (
                        <motion.div
                            key="auth-forms"
                            initial={{ opacity: 0, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, filter: 'blur(4px)' }}
                            transition={transitionConfig}
                        >
                            <BrandMotif><LogoMark /></BrandMotif>
                            <AuthTitle>{d.title}</AuthTitle>
                            <AuthSub>{d.subtitle}</AuthSub>

                            <FormBox onSubmit={handleNextStep}>
                                <FieldGroup>
                                    <LabelRow>
                                        <Label>{d.email.label}</Label>
                                        {authStep === 'initial' && (
                                            <HelpLink type="button" onClick={() => navigate({ to: '/auth', search: { forgot: 'true' } as any })}>
                                                {d.email.helpLink}
                                            </HelpLink>
                                        )}
                                    </LabelRow>
                                    <Input
                                        type="email"
                                        placeholder={d.email.placeholder}
                                        required
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={authStep === 'signup' || authStep === 'login'}
                                    />
                                </FieldGroup>

                                <AnimatePresence>
                                    {authStep === 'signup' && (
                                        <motion.div
                                            key="signup-fields"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={transitionConfig}
                                            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}
                                        >
                                            <NameSplit>
                                                <FieldGroup>
                                                    <Label>{d.signup.firstName.label}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={d.signup.firstName.placeholder}
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                    />
                                                </FieldGroup>
                                                <FieldGroup>
                                                    <Label>{d.signup.lastName.label}</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder={d.signup.lastName.placeholder}
                                                        required
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                    />
                                                </FieldGroup>
                                            </NameSplit>

                                            <FieldGroup>
                                                <Label>{d.signup.password.label}</Label>
                                                <Input
                                                    type="password"
                                                    placeholder={d.signup.password.placeholder}
                                                    required
                                                    minLength={8}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </FieldGroup>
                                        </motion.div>
                                    )}

                                    {authStep === 'login' && (
                                        <motion.div
                                            key="login-fields"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={transitionConfig}
                                            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}
                                        >
                                            <FieldGroup>
                                                <Label>Password</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </FieldGroup>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column' }}>
                                    <SubmitAction type="submit" disabled={authMutation.isPending || isSigningUp}>
                                        {authMutation.isPending || isSigningUp
                                            ? 'Processing...'
                                            : authStep === 'initial'
                                                ? d.actions.connectTerminal
                                                : authStep === 'login'
                                                    ? 'Sign in'
                                                    : d.actions.initializeDirectory}
                                    </SubmitAction>

                                    {authStep === 'initial' && (
                                        <ToggleMode type="button" onClick={toggleAuthMode}>
                                            {mode === 'signup'
                                                ? 'Already have an account? Sign in'
                                                : "Don't have an account? Create one"}
                                        </ToggleMode>
                                    )}

                                    <AnimatePresence>
                                        {(authStep === 'signup' || authStep === 'login') && (
                                            <BackAction
                                                type="button"
                                                onClick={handleBack}
                                                as={motion.button}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={transitionConfig}
                                            >
                                                <ArrowLeft size={16} /> {d.actions.backToConfig}
                                            </BackAction>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </FormBox>
                        </motion.div>
                    )}

                </AnimatePresence>
            </ConsoleStage>

            <FooterBar>
                <FooterLinks>
                    <a href={authData.footer.links[0].url}>{authData.footer.links[0].label}</a>
                    <a href={authData.footer.links[1].url}>{authData.footer.links[1].label}</a>
                </FooterLinks>
            </FooterBar>

        </AuthWrapper>
    );
}