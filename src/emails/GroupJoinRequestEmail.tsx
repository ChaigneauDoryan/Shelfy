
import {
  Html,
  Body,
  Head,
  Heading,
  Hr,
  Container,
  Preview,
  Section,
  Text,
  Button,
  Link,
} from '@react-email/components';

interface GroupJoinRequestEmailProps {
  adminName?: string; // Optional for requester notification
  requesterName: string;
  groupName: string;
  managementUrl: string;
  status?: 'pending' | 'accepted' | 'declined'; // Status of the request
}

export const GroupJoinRequestEmail = ({ 
  adminName,
  requesterName,
  groupName,
  managementUrl,
  status = 'pending', // Default to pending for admin notifications
}: GroupJoinRequestEmailProps) => {
  let previewText: string;
  let headingText: string;
  let bodyContent: JSX.Element;
  let buttonText: string;
  let subjectText: string;

  switch (status) {
    case 'accepted':
      previewText = `Votre demande pour rejoindre ${groupName} a été acceptée`;
      headingText = `Demande acceptée pour le groupe "${groupName}"`;
      subjectText = `Votre demande pour rejoindre ${groupName} a été acceptée`;
      buttonText = `Voir le groupe`;
      bodyContent = (
        <>
          <Text style={{ color: '#555', fontSize: '16px' }}>Bonjour {requesterName},</Text>
          <Text style={{ color: '#555', fontSize: '16px' }}>
            Votre demande pour rejoindre le groupe <strong>{groupName}</strong> a été acceptée. Bienvenue !
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
            <Button 
              style={{ backgroundColor: '#007bff', color: '#fff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none' }} 
              href={managementUrl}
            >
              {buttonText}
            </Button>
          </Section>
          <Text style={{ color: '#555', fontSize: '16px' }}>
            Vous pouvez maintenant accéder au groupe en cliquant sur le bouton ci-dessus.
          </Text>
        </>
      );
      break;
    case 'declined':
      previewText = `Votre demande pour rejoindre ${groupName} a été refusée`;
      headingText = `Demande refusée pour le groupe "${groupName}"`;
      subjectText = `Votre demande pour rejoindre ${groupName} a été refusée`;
      buttonText = `Voir mes groupes`;
      bodyContent = (
        <>
          <Text style={{ color: '#555', fontSize: '16px' }}>Bonjour {requesterName},</Text>
          <Text style={{ color: '#555', fontSize: '16px' }}>
            Votre demande pour rejoindre le groupe <strong>{groupName}</strong> a été refusée.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
            <Button 
              style={{ backgroundColor: '#dc3545', color: '#fff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none' }} 
              href={`${process.env.NEXTAUTH_URL}/dashboard/groups`}
            >
              {buttonText}
            </Button>
          </Section>
          <Text style={{ color: '#555', fontSize: '16px' }}>
            N'hésitez pas à explorer d'autres groupes sur Shelfy.
          </Text>
        </>
      );
      break;
    case 'pending':
    default:
      previewText = `Nouvelle demande pour rejoindre ${groupName}`;
      headingText = `Demande d'adhésion au groupe "${groupName}"`;
      subjectText = `Nouvelle demande pour rejoindre ${groupName}`;
      buttonText = `Gérer les demandes`;
      bodyContent = (
        <>
          <Text style={{ color: '#555', fontSize: '16px' }}>Bonjour {adminName},</Text>
          <Text style={{ color: '#555', fontSize: '16px' }}>
            L'utilisateur <strong>{requesterName}</strong> souhaite rejoindre votre groupe de lecture, <strong>{groupName}</strong>.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
            <Button 
              style={{ backgroundColor: '#007bff', color: '#fff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none' }} 
              href={managementUrl}
            >
              {buttonText}
            </Button>
          </Section>
          <Text style={{ color: '#555', fontSize: '16px' }}>
            Vous pouvez examiner cette demande en cliquant sur le bouton ci-dessus ou en visitant la page de gestion de votre groupe.
          </Text>
        </>
      );
      break;
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', borderRadius: '8px' }}>
          <Heading style={{ color: '#333', fontSize: '24px' }}>{headingText}</Heading>
          {bodyContent}
          <Hr style={{ borderColor: '#cccccc', marginTop: '20px' }} />
          <Text style={{ color: '#888', fontSize: '12px' }}>
            {status === 'pending' ? `Vous recevez cet e-mail car vous êtes administrateur du groupe "${groupName}" sur Shelfy.` : `Cet e-mail vous a été envoyé par Shelfy.`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};


export default GroupJoinRequestEmail;
