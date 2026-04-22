const { algoliasearch } = require('algoliasearch');

const client = algoliasearch('WHKSK7X34Y', '506813970414b8d353a96ca1ed1481d0');

async function configureIndex() {
  await client.setSettings({
    indexName: 'leads',
    indexSettings: {
      searchableAttributes: ['name', 'email', 'phone', 'project', 'community', 'nationality'],
      attributesForFaceting: [
        'filterOnly(status)',
        'filterOnly(source)',
        'filterOnly(community)',
        'filterOnly(nationality)',
        'filterOnly(propertyType)',
        'filterOnly(language)',
        'filterOnly(bedrooms)',
        'filterOnly(developer)',
        'filterOnly(paymentType)',
        'filterOnly(visaEligibility)',
        'filterOnly(planType)',
        'filterOnly(tags)',
        'filterOnly(budget)',
        'filterOnly(followUpDate)',
        'filterOnly(createdAt)'
      ],
      hitsPerPage: 100
    }
  });
  console.log('Index configured!');
  process.exit(0);
}

configureIndex().catch(err => { console.error(err); process.exit(1); });
