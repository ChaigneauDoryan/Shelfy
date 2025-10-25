
import { Html, Button, Text, Container, Section, Heading, Hr } from '@react-email/components';

interface EmailVerificationEmailProps {
  validationLink: string;
}

export default function EmailVerificationEmail({ validationLink }: EmailVerificationEmailProps) {
  return (
    <Html lang="fr">
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Vérifiez votre adresse e-mail</Heading>
          <Hr style={hr} />
          <Text style={paragraph}>Bonjour,</Text>
          <Text style={paragraph}>
            Merci de vous être inscrit sur Shelfy. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={validationLink}>
              Vérifier l'e-mail
            </Button>
          </Section>
          <Text style={paragraph}>
            Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail en toute sécurité.
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

const container = {
  backgroundColor: '#f6f6f6',
  padding: '10px',
};

const box = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 auto',
  width: '100%',
  maxWidth: '600px',
};

const h1 = {
  color: '#1d1c1d',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};
