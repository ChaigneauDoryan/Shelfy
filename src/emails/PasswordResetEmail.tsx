import { Html, Button, Text, Container, Section, Heading, Hr } from '@react-email/components';

interface PasswordResetEmailProps {
  resetLink: string;
}

export default function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <Html lang="fr">
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Réinitialisation de mot de passe</Heading>
          <Hr style={hr} />
          <Text style={paragraph}>Bonjour,</Text>
          <Text style={paragraph}>
            Quelqu'un a demandé une réinitialisation de mot de passe pour votre compte. Si c'était vous, veuillez cliquer sur le bouton ci-dessous pour réinitialiser votre mot de passe.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Réinitialiser le mot de passe
            </Button>
          </Section>
          <Text style={paragraph}>
            Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail en toute sécurité.
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