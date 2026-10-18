#!/usr/bin/env node

/**
 * Create Patients Compass one-time digital products through Shopify Admin GraphQL.
 *
 * Safe defaults:
 *   node scripts/shopify/create-digital-products.mjs
 *   -> dry run; no Shopify writes
 *
 * Create draft products:
 *   SHOPIFY_ADMIN_ACCESS_TOKEN='...' \
 *   node scripts/shopify/create-digital-products.mjs --confirm
 *
 * Publish only after assets are attached and tested in Digital Products:
 *   SHOPIFY_ADMIN_ACCESS_TOKEN='...' \
 *   node scripts/shopify/create-digital-products.mjs --confirm --publish
 *
 * Required token scopes include write_products and read_publications. The token
 * must remain server-side and must never be exposed in browser code or logs.
 */

const STORE_DOMAIN = process.env.SHOPIFY_ADMIN_STORE_DOMAIN || 's064cx-hu.myshopify.com';
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-10';
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
const CONFIRM = process.argv.includes('--confirm');
const PUBLISH = process.argv.includes('--publish');
const ENDPOINT = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

const products = [
  {
    title: 'Start Here Health Organization Workbook',
    handle: 'start-here-health-organization-workbook',
    price: '7.00',
    descriptionHtml: '<p>A practical workbook for organizing symptoms, questions, medications, and health goals before a care conversation.</p><p><em>Educational support only. This product does not diagnose or treat medical conditions.</em></p>',
    tags: ['digital-product', 'workbook', 'patients-compass', 'one-time'],
  },
  {
    title: 'Doctor Visit Preparation Workbook',
    handle: 'doctor-visit-preparation-workbook',
    price: '12.00',
    descriptionHtml: '<p>A structured workbook for appointment notes, questions, and follow-up planning.</p><p><em>Educational support only. This product does not diagnose or treat medical conditions.</em></p>',
    tags: ['digital-product', 'workbook', 'doctor-prep', 'patients-compass', 'one-time'],
  },
  {
    title: 'Lab Results Conversation Guide',
    handle: 'lab-results-conversation-guide',
    price: '15.00',
    descriptionHtml: '<p>A plain-language guide for preparing questions about lab results.</p><p><em>Educational support only. This product does not diagnose or treat medical conditions.</em></p>',
    tags: ['digital-product', 'lab-education', 'patients-compass', 'one-time'],
  },
  {
    title: 'Clinical Conversation Toolkit',
    handle: 'clinical-conversation-toolkit',
    price: '29.00',
    descriptionHtml: '<p>A bundle of doctor preparation, lab questions, symptom tracking, and follow-up planning tools.</p><p><em>Educational support only. This product does not diagnose or treat medical conditions.</em></p>',
    tags: ['digital-product', 'bundle', 'doctor-prep', 'patients-compass', 'one-time'],
  },
  {
    title: 'Patients Compass Starter Bundle',
    handle: 'patients-compass-starter-bundle',
    price: '39.00',
    descriptionHtml: '<p>A starter bundle combining the core Patients Compass education workbooks.</p><p><em>Educational support only. This product does not diagnose or treat medical conditions.</em></p>',
    tags: ['digital-product', 'bundle', 'patients-compass', 'one-time'],
  },
  {
    title: 'Healthy Habits for Super Kids Activity Pack',
    handle: 'healthy-habits-for-super-kids-activity-pack',
    price: '0.00',
    descriptionHtml: '<p>A free 19-page activity pack for families.</p><p><em>Educational resource only. This product does not diagnose or treat medical conditions.</em></p>',
    tags: ['digital-product', 'super-kids', 'free-resource', 'patients-compass'],
  },
];

const CREATE_PRODUCT = `#graphql
mutation CreatePatientsCompassDigitalProduct($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product {
      id
      title
      handle
      status
      variants(first: 1) {
        nodes {
          id
          title
          price
          inventoryItem { id requiresShipping tracked }
        }
      }
    }
    userErrors { field message }
  }
}`;

const UPDATE_VARIANT = `#graphql
mutation ConfigureDigitalVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants {
      id
      price
      inventoryItem { id requiresShipping tracked }
    }
    userErrors { field message }
  }
}`;

const FIND_PRODUCTS = `#graphql
query ExistingProducts($query: String!) {
  products(first: 50, query: $query) {
    nodes { id title handle status variants(first: 1) { nodes { id price inventoryItem { id requiresShipping tracked } } } }
  }
}`;

const PUBLICATIONS = `#graphql
query OnlineStorePublications {
  publications(first: 50) { nodes { id name } }
}`;

const PUBLISH_PRODUCT = `#graphql
mutation PublishPatientsCompassProduct($id: ID!, $publicationId: ID!) {
  publishablePublish(id: $id, input: [{ publicationId: $publicationId }]) {
    publishable { id }
    userErrors { field message }
  }
}`;

async function adminGraphQL(query, variables = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.errors?.length) {
    throw new Error(JSON.stringify({ status: response.status, errors: body.errors || body }, null, 2));
  }
  return body.data;
}

function printPlan() {
  console.log(`Store: ${STORE_DOMAIN}`);
  console.log(`API: ${API_VERSION}`);
  console.log(`Mode: ${CONFIRM ? (PUBLISH ? 'CREATE + PUBLISH' : 'CREATE DRAFTS') : 'DRY RUN'}`);
  for (const item of products) console.log(`- ${item.title} — $${item.price} — ${item.handle}`);
}

function assertErrors(label, errors) {
  if (errors?.length) throw new Error(`${label}: ${JSON.stringify(errors)}`);
}

async function main() {
  printPlan();
  if (!CONFIRM) {
    console.log('\nDry run only. Re-run with --confirm to create draft products.');
    return;
  }
  if (!TOKEN) throw new Error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN. Keep it server-side and do not paste it into chat.');

  const existing = await adminGraphQL(FIND_PRODUCTS, {
    query: 'vendor:"The Patient\'s Compass" AND tag:digital-product',
  });
  const byHandle = new Map(existing.products.nodes.map((product) => [product.handle, product]));
  const created = [];

  for (const item of products) {
    const existingProduct = byHandle.get(item.handle);
    if (existingProduct) {
      console.log(`SKIP existing ${item.handle} (${existingProduct.id})`);
      created.push({ item, product: existingProduct, variant: existingProduct.variants.nodes[0] });
      continue;
    }

    const data = await adminGraphQL(CREATE_PRODUCT, {
      product: {
        title: item.title,
        handle: item.handle,
        descriptionHtml: item.descriptionHtml,
        vendor: "The Patient's Compass",
        productType: 'Digital Health Education',
        tags: item.tags,
        status: 'DRAFT',
      },
    });
    assertErrors(`productCreate ${item.handle}`, data.productCreate.userErrors);

    const product = data.productCreate.product;
    const variant = product.variants.nodes[0];
    const configured = await adminGraphQL(UPDATE_VARIANT, {
      productId: product.id,
      variants: [{
        id: variant.id,
        price: item.price,
        inventoryItem: { requiresShipping: false, tracked: false },
      }],
    });
    assertErrors(`productVariantsBulkUpdate ${item.handle}`, configured.productVariantsBulkUpdate.userErrors);

    const updatedVariant = configured.productVariantsBulkUpdate.productVariants[0];
    console.log(`CREATED DRAFT ${item.handle}: ${product.id} / ${updatedVariant.id} / $${updatedVariant.price}`);
    created.push({ item, product, variant: updatedVariant });
  }

  if (!PUBLISH) {
    console.log('\nProducts remain DRAFT. Attach files in the Digital Products app, test delivery, then publish.');
    return;
  }

  const publicationData = await adminGraphQL(PUBLICATIONS);
  const onlineStore = publicationData.publications.nodes.find((publication) => /online store/i.test(publication.name));
  if (!onlineStore) throw new Error('Online Store publication was not found; no products were published.');

  for (const entry of created) {
    const published = await adminGraphQL(PUBLISH_PRODUCT, {
      id: entry.product.id,
      publicationId: onlineStore.id,
    });
    assertErrors(`publishablePublish ${entry.item.handle}`, published.publishablePublish.userErrors);
    console.log(`PUBLISHED ${entry.item.handle} to ${onlineStore.name}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
