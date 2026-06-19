const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kasheer360',
  url: 'https://kasheer360.com',
  logo: 'https://kasheer360.com/logo.png',
  description:
    'Kashmir\'s local travel marketplace connecting travelers directly with verified hotels, houseboats, taxi operators, guides, and experience providers.',
  slogan: 'Connect Direct. Book Local.',
  areaServed: {
    '@type': 'State',
    name: 'Jammu and Kashmir',
  },
  foundingLocation: {
    '@type': 'City',
    name: 'Srinagar',
  },
  sameAs: [],
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'Kasheer360',
  url: 'https://kasheer360.com',
  description:
    'Local travel marketplace for booking hotels, houseboats, shikara rides, taxis, and tour packages directly with verified Kashmir providers.',
  areaServed: [
    { '@type': 'City', name: 'Srinagar' },
    { '@type': 'City', name: 'Gulmarg' },
    { '@type': 'City', name: 'Pahalgam' },
    { '@type': 'City', name: 'Sonamarg' },
    { '@type': 'City', name: 'Jammu' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Kashmir Travel Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Houseboat Booking' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Hotel Booking' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Homestay Booking' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Shikara Ride' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Taxi Service' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tour Package' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Local Guide' } },
    ],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Kasheer360?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kasheer360 is Kashmir\'s local travel marketplace that connects travelers directly with verified hotels, houseboats, taxi operators, shikara owners, guides, and tour providers — no middlemen, no commissions, just direct booking.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book a houseboat in Srinagar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browse verified houseboats on Kasheer360, compare tariffs and photos, and contact the houseboat owner directly via WhatsApp or phone to book.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Kasheer360 free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Travelers can browse and contact providers for free. Local businesses can list their services with a free plan or upgrade to Pro for unlimited leads.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the listings on Kasheer360 verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Each provider is verified to ensure they are legitimate local businesses. Verified listings have a badge and confirmed WhatsApp contact.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I book a taxi or tour package through Kasheer360?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can find verified taxi operators, tour guides, and package providers across Srinagar, Gulmarg, Pahalgam, Sonamarg, and other Kashmir destinations.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I contact a service provider?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each listing has a direct WhatsApp link and phone number. You can message or call the provider directly — no forms, no intermediaries.',
      },
    },
  ],
};

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}

export function LocalBusinessSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  );
}

export function FaqSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
