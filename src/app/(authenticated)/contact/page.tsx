'use client';

import { ContactForm } from '@/components/ContactForm';
import PageHeader from '@/components/ui/PageHeader';

export default function ContactPage() {
  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Nous Contacter"
        description="Une question, une suggestion ou un problème ? Faites-le nous savoir."
      />
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
