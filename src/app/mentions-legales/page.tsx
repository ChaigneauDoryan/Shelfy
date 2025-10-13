import React from 'react';

export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mentions Légales</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Informations Générales</h2>
        <p className="mb-2">
          Ce site web est édité par : [Votre Nom/Nom de l'entreprise]
        </p>
        <p className="mb-2">
          Adresse : [Votre Adresse Complète]
        </p>
        <p className="mb-2">
          E-mail : [Votre Adresse E-mail de Contact]
        </p>
        <p className="mb-2">
          Téléphone : [Votre Numéro de Téléphone]
        </p>
        <p className="mb-2">
          Numéro d'immatriculation (si applicable) : [Numéro SIRET/RCS/etc.]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Hébergement</h2>
        <p className="mb-2">
          Le site est hébergé par : [Nom de l'Hébergeur]
        </p>
        <p className="mb-2">
          Adresse de l'hébergeur : [Adresse de l'Hébergeur]
        </p>
        <p className="mb-2">
          Site web de l'hébergeur : [Site Web de l'Hébergeur]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Propriété Intellectuelle</h2>
        <p className="mb-2">
          L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
        </p>
        <p className="mb-2">
          La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Limitation de Responsabilité</h2>
        <p className="mb-2">
          [Votre Nom/Nom de l'entreprise] ne saurait être tenu pour responsable des erreurs rencontrées sur le site, problèmes techniques, interprétation des informations publiées et conséquences de leur utilisation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Droit Applicable</h2>
        <p className="mb-2">
          Les présentes mentions légales sont régies par le droit français.
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-10">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
