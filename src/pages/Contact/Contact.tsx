import styled from 'styled-components';
import { motion } from 'framer-motion';
import { PageHero } from '@components/organisms';
import { Button, Input, Textarea } from '@components/atoms'; // Assuming these exist from Phase 2
import { Helmet } from 'react-helmet-async';
import { Mail, MapPin, Linkedin, Twitter, Github } from 'lucide-react';

const ContactContainer = styled.main`
  background: ${({ theme }) => theme.colors.background.primary};
  min-height: 100vh;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[16]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[12]};
  }
`;

const InfoSection = styled(motion.div)`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[8]};
`;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const IconWrapper = styled.div`
  color: ${({ theme }) => theme.colors.accent.teal};
  background: ${({ theme }) => theme.colors.accent.teal}15;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.full};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContactDetail = styled.div`
  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    margin-bottom: ${({ theme }) => theme.spacing[1]};
  }
  
  p, a {
    color: ${({ theme }) => theme.colors.text.secondary};
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: ${({ theme }) => theme.colors.accent.teal};
    }
  }
`;

const FormSection = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing[10]};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  
  label {
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[12]};
`;

const SocialLink = styled.a`
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent.teal};
    transform: translateY(-2px);
  }
`;

const Contact = () => {
    return (
        <ContactContainer>
            <Helmet>
                <title>Contact Us | NERYVA</title>
                <meta name="description" content="Get in touch with NERYVA Research. Collaborate with us to democratize critical care intelligence." />
            </Helmet>

            <PageHero
                title="Get in Touch"
                subtitle="Whether you're a researcher, clinician, or potential partner, we're ready to collaborate on the future of critical care."
                breadcrumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'Contact', href: '/contact' }
                ]}
            />

            <ContentWrapper>
                <InfoSection initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <SectionTitle>Collaborate with the Lab</SectionTitle>
                    <Description>
                        We are actively seeking partnerships with healthcare systems in resource-constrained regions, as well as research collaborations in physics-based ML and clinical robotics.
                    </Description>

                    <ContactList>
                        <ContactItem>
                            <IconWrapper><Mail size={24} /></IconWrapper>
                            <ContactDetail>
                                <h4>General Inquiries</h4>
                                <a href="mailto:collaborate@neryva.org">collaborate@neryva.org</a>
                            </ContactDetail>
                        </ContactItem>

                        <ContactItem>
                            <IconWrapper><MapPin size={24} /></IconWrapper>
                            <ContactDetail>
                                <h4>Lab Headquarters</h4>
                                <p>1280 Research Parkway, Suite 400<br />Cambridge, MA 02142</p>
                            </ContactDetail>
                        </ContactItem>
                    </ContactList>

                    <SocialLinks>
                        <SocialLink href="https://github.com/neryva" target="_blank" aria-label="GitHub">
                            <Github size={24} />
                        </SocialLink>
                        <SocialLink href="https://linkedin.com/company/neryva" target="_blank" aria-label="LinkedIn">
                            <Linkedin size={24} />
                        </SocialLink>
                        <SocialLink href="https://twitter.com/neryva_research" target="_blank" aria-label="Twitter">
                            <Twitter size={24} />
                        </SocialLink>
                    </SocialLinks>
                </InfoSection>

                <FormSection initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <FormGroup>
                            <label>Name</label>
                            <Input placeholder="Dr. Jane Doe" />
                        </FormGroup>

                        <FormGroup>
                            <label>Email</label>
                            <Input placeholder="jane@hospital.org" type="email" />
                        </FormGroup>

                        <FormGroup>
                            <label>Subject</label>
                            <Input placeholder="Research Partnership" />
                        </FormGroup>

                        <FormGroup>
                            <label>Message</label>
                            <Textarea placeholder="Tell us about your organization and how we might work together..." rows={5} />
                        </FormGroup>

                        <Button variant="primary" size="lg" style={{ width: '100%' }}>
                            Send Message
                        </Button>
                    </form>
                </FormSection>
            </ContentWrapper>
        </ContactContainer>
    );
};

export default Contact;
