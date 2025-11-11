import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ReadingReminderEmailProps {
  groupName: string;
  bookTitle: string;
  readingEndDate: string; // Formaté pour l'affichage
  groupLink: string;
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#5F51E8',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
};

export const ReadingReminderEmail = ({
  groupName = 'Votre Groupe',
  bookTitle = 'Titre du Livre',
  readingEndDate = 'Date de fin',
  groupLink = 'https://shelfy.com/group/abc',
}: ReadingReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Rappel de lecture : Il ne reste que 24 heures pour finir {bookTitle} !
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {/* <Img
          src={`${baseUrl}/static/koala-logo.png`}
          width="170"
          height="50"
          alt="Koala"
          style={logo}
        /> */}
        <Text style={paragraph}>Bonjour,</Text>
        <Text style={paragraph}>
          Ceci est un rappel amical de votre groupe de lecture "{groupName}".
        </Text>
        <Text style={paragraph}>
          Il ne reste que 24 heures pour terminer la lecture de "{bookTitle}" ! La date de fin de lecture est fixée au {readingEndDate}.
        </Text>
        <Text style={paragraph}>
          Assurez-vous de terminer votre lecture et de partager vos dernières réflexions avec le groupe.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={groupLink}>
            Accéder au groupe
          </Button>
        </Section>
        <Text style={paragraph}>
          À bientôt sur Shelfy,
          <br />
          L'équipe Shelfy
        </Text>
        <hr style={hr} />
        <Text style={footer}>
          Si vous ne souhaitez plus recevoir ces e-mails, vous pouvez ajuster vos préférences de notification dans les paramètres de votre compte Shelfy.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ReadingReminderEmail;