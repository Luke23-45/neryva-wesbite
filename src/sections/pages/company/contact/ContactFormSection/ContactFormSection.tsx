import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContactMutation } from '@/hooks/mutations/useContactMutation';
import {
  SectionWrapper,
  LeftColumn,
  RightColumn,
  SidebarTitle,
  SidebarBlocksWrapper,
  SidebarBlock,
  BlockHeader,
  IconWrapper,
  BlockTitle,
  BlockContent,
  BlockFooter,
  SecondaryButton,
  SecondaryIconContainer,
  FormContainer,
  FormRow,
  FormGroup,
  Label,
  Input,
  TextArea,
  CheckboxGroup,
  CheckboxWrapper,
  Checkbox,
  CheckboxLabel,
  Disclaimer,
  SubmitButton,
  SuccessContainer,
  SuccessIcon,
  SuccessTitle,
  SuccessBody,
  SendAnotherLink,
} from './ContactFormSection.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as any,
      delay: custom * 0.1,
    },
  }),
};

// Sleek geometric SVGs instead of pixel art, fitting for a modern lab
const Icons: Record<string, React.ReactNode> = {
  headphone: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2458D3" strokeWidth="2.5" strokeLinecap="square">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1v-3a2 2 0 0 1 2-2h1zM3 19a2 2 0 0 0 2 2h1v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  megaphone: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2.5" strokeLinecap="square">
      <path d="M11 12H3" />
      <path d="M11 5l8-2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2l-8-2V5z" />
      <path d="M14 21v-4" />
    </svg>
  ),
  lock: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6A800" strokeWidth="2.5" strokeLinecap="square">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  target: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0B7F79" strokeWidth="2.5" strokeLinecap="square">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

const premiumTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as any
};

const PixelRightArrow = () => (
  <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="4" y="1" width="2" height="2" />
    <rect x="6" y="3" width="2" height="2" />
    <rect x="8" y="5" width="2" height="2" />
    <rect x="10" y="6" width="2" height="2" />
    <rect x="8" y="7" width="2" height="2" />
    <rect x="6" y="9" width="2" height="2" />
    <rect x="4" y="11" width="2" height="2" />
  </svg>
);

const AnimatedSidebarButton = ({ text, url }: { text: string; url: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SecondaryButton
      onClick={() => { window.location.href = url; }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SecondaryIconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 12 : 0,
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -8,
          marginRight: isHovered ? 6 : 0
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <PixelRightArrow />
      </SecondaryIconContainer>

      {text}

      <SecondaryIconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 0 : 12,
          opacity: isHovered ? 0 : 1,
          x: isHovered ? 8 : 0,
          marginLeft: isHovered ? 0 : 6
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <PixelRightArrow />
      </SecondaryIconContainer>
    </SecondaryButton>
  );
};

interface Props {
  data: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2, ease: [0.16, 1, 0.3, 1] as any },
  },
};

const successItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any },
  },
};

export function ContactFormSection({ data }: Props) {
  const contactMutation = useContactMutation();
  const [submitted, setSubmitted] = useState(false); // TODO: revert to false after design review
  const [submittedName, setSubmittedName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [project, setProject] = useState('');
  const [optInUpdates, setOptInUpdates] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(
      { firstName, lastName, email, role, project, optInUpdates },
      {
        onSuccess: () => {
          setSubmittedName(firstName);
          setSubmittedEmail(email);
          setSubmitted(true);
          setFirstName('');
          setLastName('');
          setEmail('');
          setRole('');
          setProject('');
          setOptInUpdates(false);
        },
      },
    );
  };

  const handleSendAnother = () => {
    setSubmitted(false);
  };

  return (
    <SectionWrapper>
      <LeftColumn>
        <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <SidebarTitle>{data.sidebar.title}</SidebarTitle>
        </motion.div>

        <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <SidebarBlocksWrapper>
            {data.sidebar.items.map((item: any) => (
              <SidebarBlock key={item.id}>
                <BlockHeader>
                  <IconWrapper>{Icons[item.icon]}</IconWrapper>
                  <BlockTitle>{item.title}</BlockTitle>
                </BlockHeader>

                <BlockContent>
                  {item.links ? (
                    <ul>
                      {item.links.map((link: any, i: number) => {
                        if (link.highlight) {
                          const parts = link.text.split(link.highlight);
                          return (
                            <li key={i}>
                              <span>
                                {parts[0]}
                                <a href={link.url}>{link.highlight}</a>
                                {parts[1]}
                              </span>
                            </li>
                          );
                        }
                        return (
                          <li key={i}>
                            <span><a href={link.url}>{link.text}</a></span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p dangerouslySetInnerHTML={{ __html: item.content }} />
                  )}
                </BlockContent>

                {item.button && (
                  <div style={{ marginTop: 'auto' }}>
                    <AnimatedSidebarButton text={item.button.text} url={item.button.url} />
                  </div>
                )}

                {item.footer && <BlockFooter>{item.footer}</BlockFooter>}
              </SidebarBlock>
            ))}
          </SidebarBlocksWrapper>
        </motion.div>
      </LeftColumn>

      <RightColumn>
        <motion.div custom={4} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
          <AnimatePresence mode="wait">
            {submitted ? (
              <SuccessContainer
                key="success"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              >
                <motion.div key="icon" variants={successItem} style={{ marginBottom: 0 }}>
                  <SuccessIcon>
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <motion.circle
                        cx="32" cy="32" r="28"
                        stroke="#1A1A1A" strokeWidth="1.5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <motion.path
                        d="M22 34l8 8 14-16"
                        stroke="#1A1A1A" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                  </SuccessIcon>
                </motion.div>

                <motion.div key="title" variants={successItem}>
                  <SuccessTitle>Thank{submittedName ? ` you, ${submittedName}` : ''}.</SuccessTitle>
                </motion.div>

                <motion.div key="body" variants={successItem}>
                  <SuccessBody>
                    Your message has been received. We review every inquiry carefully and typically respond within 2 business days.
                  </SuccessBody>
                  <SuccessBody>
                    We'll reach out to you at <strong>{submittedEmail}</strong>.
                  </SuccessBody>
                </motion.div>

                <motion.div key="action" variants={successItem}>
                  <SendAnotherLink type="button" onClick={handleSendAnother}>
                    Send another message
                  </SendAnotherLink>
                </motion.div>
              </SuccessContainer>
            ) : (
              <FormContainer key="form" onSubmit={handleFormSubmit}>
                <FormGroup>
                  <Label>{data.form.fields.firstName.label}<span>*</span></Label>
                  <Input
                    type="text"
                    required
                    placeholder={data.form.fields.firstName.placeholder}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>{data.form.fields.lastName.label}<span>*</span></Label>
                  <Input
                    type="text"
                    required
                    placeholder={data.form.fields.lastName.placeholder}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{data.form.fields.email.label}<span>*</span></Label>
                  <Input
                    type="email"
                    required
                    placeholder={data.form.fields.email.placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{data.form.fields.role.label}<span>*</span></Label>
                  <Input
                    type="text"
                    required
                    placeholder={data.form.fields.role.placeholder}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{data.form.fields.project.label}<span>*</span></Label>
                  <TextArea
                    required
                    placeholder={data.form.fields.project.placeholder}
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                  />
                </FormGroup>

                <CheckboxGroup>
                  <CheckboxWrapper>
                    <Checkbox
                      type="checkbox"
                      id="updates"
                      checked={optInUpdates}
                      onChange={(e) => setOptInUpdates(e.target.checked)}
                    />
                  </CheckboxWrapper>
                  <CheckboxLabel htmlFor="updates">{data.form.checkbox}</CheckboxLabel>
                </CheckboxGroup>

                <Disclaimer dangerouslySetInnerHTML={{ __html: data.form.disclaimer.replace('Terms of Service', '<a href="#">Terms of Service</a>').replace('Privacy Policy', '<a href="#">Privacy Policy</a>') }} />

                <SubmitButton type="submit" disabled={contactMutation.isPending}>
                  {contactMutation.isPending ? 'Sending...' : data.form.submit}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </SubmitButton>
              </FormContainer>
            )}
          </AnimatePresence>
        </motion.div>
      </RightColumn>
    </SectionWrapper>
  );
}
