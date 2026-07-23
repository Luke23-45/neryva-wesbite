import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  data: any; // Using any for simplicity in this component, normally would type strictly
}

export function ContactFormSection({ data }: Props) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Form submission simulated. In production, this would hit an API endpoint.");
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
          <FormContainer onSubmit={handleFormSubmit}>
            <FormGroup>
              <Label>{data.form.fields.firstName.label}<span>*</span></Label>
              <Input type="text" required placeholder={data.form.fields.firstName.placeholder} />
            </FormGroup>
            <FormGroup>
              <Label>{data.form.fields.lastName.label}<span>*</span></Label>
              <Input type="text" required placeholder={data.form.fields.lastName.placeholder} />
            </FormGroup>

            <FormGroup>
              <Label>{data.form.fields.email.label}<span>*</span></Label>
              <Input type="email" required placeholder={data.form.fields.email.placeholder} />
            </FormGroup>

            <FormGroup>
              <Label>{data.form.fields.role.label}<span>*</span></Label>
              <Input type="text" required placeholder={data.form.fields.role.placeholder} />
            </FormGroup>

            <FormGroup>
              <Label>{data.form.fields.project.label}<span>*</span></Label>
              <TextArea required placeholder={data.form.fields.project.placeholder} />
            </FormGroup>

            <CheckboxGroup>
              <CheckboxWrapper>
                <Checkbox type="checkbox" id="updates" />
              </CheckboxWrapper>
              <CheckboxLabel htmlFor="updates">{data.form.checkbox}</CheckboxLabel>
            </CheckboxGroup>

            <Disclaimer dangerouslySetInnerHTML={{ __html: data.form.disclaimer.replace('Terms of Service', '<a href="#">Terms of Service</a>').replace('Privacy Policy', '<a href="#">Privacy Policy</a>') }} />

            <SubmitButton type="submit">
              {data.form.submit}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </SubmitButton>
          </FormContainer>
        </motion.div>
      </RightColumn>
    </SectionWrapper>
  );
}
