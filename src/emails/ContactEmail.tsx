import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ContactEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  plan: string;
}

export const ContactEmail = ({
  name,
  email,
  subject,
  message,
  plan,
}: ContactEmailProps) => (
  <Html>
    <Head />
    <Preview>Nouveau message de contact de {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Nouveau message via le formulaire de contact</Heading>
        <Section style={section}>
          <Text style={label}>De :</Text>
          <Text style={text}>{name}</Text>
        </Section>
        <Section style={section}>
          <Text style={label}>Email :</Text>
          <Text style={text}>{email}</Text>
        </Section>
        <Section style={section}>
          <Text style={label}>Plan de l'utilisateur :</Text>
          <Text style={plan === 'Premium' ? premiumText : text}>{plan}</Text>
        </Section>
        <Hr style={hr} />
        <Section style={section}>
          <Text style={label}>Sujet :</Text>
          <Heading as="h2" style={subjectHeading}>{subject}</Heading>
        </Section>
        <Section style={messageSection}>
          <Text style={label}>Message :</Text>
          <Text style={text}>{message}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ContactEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '0 20px',
};

const section = {
  padding: '0 20px',
};

const messageSection = {
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e9ecef',
  borderBottom: '1px solid #e9ecef',
};

const label = {
  fontSize: '14px',
  color: '#5f6368',
  marginBottom: '4px',
};

const text = {
  fontSize: '16px',
  color: '#1a1a1a',
  lineHeight: '1.5',
  marginTop: '0',
};

const premiumText = {
  ...text,
  color: '#1a73e8',
  fontWeight: 'bold',
};

const subjectHeading = {
    fontSize: '20px',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};
