import React from 'react';

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-2">
          La présente Politique de Confidentialité décrit comment [Votre Nom/Nom de l'entreprise] collecte, utilise et protège les informations que vous nous fournissez lorsque vous utilisez notre site web.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Données Collectées</h2>
        <p className="mb-2">
          Nous pouvons collecter les types d'informations suivants :
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Informations d'identification personnelle (nom, adresse e-mail, etc.)</li>
          <li>Données d'utilisation (pages visitées, temps passé sur le site, etc.)</li>
          <li>Informations techniques (adresse IP, type de navigateur, etc.)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Utilisation des Données</h2>
        <p className="mb-2">
          Les informations collectées sont utilisées pour :
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Fournir et maintenir notre service</li>
          <li>Améliorer votre expérience utilisateur</li>
          <li>Communiquer avec vous</li>
          <li>Analyser l'utilisation de notre site</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Partage des Données</h2>
        <p className="mb-2">
          Nous ne vendons, n'échangeons ni ne louons vos informations d'identification personnelle à des tiers. Nous pouvons partager des informations génériques agrégées non liées à une identification personnelle avec nos partenaires commerciaux, nos affiliés de confiance et nos annonceurs à des fins décrites ci-dessus.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Vos Droits</h2>
        <p className="mb-2">
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition au traitement de vos données personnelles. Pour exercer ces droits, veuillez nous contacter à [Votre Adresse E-mail de Contact].
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Modifications de la Politique de Confidentialité</h2>
        <p className="mb-2">
          Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page.
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-10">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
