import React from 'react';
import { motion } from 'framer-motion';
import {
  SectionWrapper,
  LeftColumn,
  RightColumn,
  SidebarTitle,
  SidebarBlock,
  BlockHeader,
  IconWrapper,
  BlockTitle,
  BlockContent,
  BlockFooter,
  SecondaryButton,
  FormContainer,
  FormRow,
  FormGroup,
  Label,
  Input,
  TextArea,
  CheckboxGroup,
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

        {data.sidebar.items.map((item: any, index: number) => (
          <motion.div key={item.id} custom={index + 2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SidebarBlock>
              <BlockHeader>
                <IconWrapper>{Icons[item.icon]}</IconWrapper>
                <BlockTitle>{item.title}</BlockTitle>
              </BlockHeader>
              
              <BlockContent>
                {item.links ? (
                  <ul>
                    {item.links.map((link: any, i: number) => (
                      <li key={i}>
                        <span><a href={link.url}>{link.text}</a></span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{item.content}</p>
                )}
              </BlockContent>

              {item.button && (
                <SecondaryButton>
                  {item.button.text}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </SecondaryButton>
              )}

              {item.footer && <BlockFooter>{item.footer}</BlockFooter>}
            </SidebarBlock>
          </motion.div>
        ))}
      </LeftColumn>

      <RightColumn>
        <motion.div custom={4} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
          <FormContainer onSubmit={handleFormSubmit}>
            <FormRow>
              <FormGroup>
                <Label>{data.form.fields.firstName.label}<span>*</span></Label>
                <Input type="text" required placeholder={data.form.fields.firstName.placeholder} />
              </FormGroup>
              <FormGroup>
                <Label>{data.form.fields.lastName.label}<span>*</span></Label>
                <Input type="text" required placeholder={data.form.fields.lastName.placeholder} />
              </FormGroup>
            </FormRow>

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
              <Checkbox type="checkbox" id="updates" />
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
