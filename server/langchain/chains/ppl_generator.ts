/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LLMChain } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { llmModel } from '../models/llm_model';

const template = `
You will be given a question about some metrics from a user.
Use context provided to write a PPL query that can be used to retrieve the information.

Here are some sample questions and the PPL query to retrieve the information. Format:
Question: human question
Fields:
- field_name: field_type (sample field value)
PPL: PPL query
----------------

Question: Give me some documents in index 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | head 10

Question: Give me 5 oldest people in index 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | sort -age | head 5

Question: Give me first names of 5 youngest people in index 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | sort +age | head 5 | fields \`firstname\`

Question: Give me some addresses in index 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | fields \`address\`

Question: Find the document in index 'accounts' where firstname is 'Hattie'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | where \`firstname\` = 'Hattie'

Question: Find the emails that contain '.com' in index 'accounts' where firstname is 'Hattie' or lastname is 'Frank'. email field is 'email'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | where MATCH(\`email\`, '.com') | where \`firstname\` = 'Hattie' OR \`lastname\` = 'frank' | fields \`email\`

Question: Find the document in index 'accounts' where firstname is not 'Hattie' and lastname is not 'Frank'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | where \`firstname\` != 'Hattie' AND \`lastname\` != 'frank'

Question: Count the number of documents in index 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | stats COUNT() AS \`count\`

Question: Count the number of people with firstname 'Amber' in index 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | where \`firstname\` ='Amber' | stats COUNT() AS \`count\`

Question: How many people are older than 33? index is 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | where \`age\` > 33 | stats COUNT() AS \`count\`

Question: How many males and females in index 'accounts'?
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | stats COUNT() AS \`count\` BY \`gender\`

Question: What is the average, minimum, maximum age in 'accounts' index?
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | stats AVG(\`age\`) AS \`avg_age\`, MIN(\`age\`) AS \`min_age\`, MAX(\`age\`) AS \`max_age\`

Question: Show all states sorted by average balance. index is 'accounts'
Fields:
- account_number: long (101)
- address: text ("880 Holmes Lane")
- age: long (32)
- balance: long (39225)
- city: text ("Brogan")
- email: text ("amberduke@pyrami.com")
- employer: text ("Pyrami")
- firstname: text ("Amber")
- gender: text ("M")
- lastname: text ("Duke")
- state: text ("IL")
PPL: source=\`accounts\` | stats AVG(\`balance\`) AS \`avg_balance\` BY \`state\` | sort +avg_balance

Question: What is the average price of products in clothing category ordered in the last 7 days? index is 'ecommerce'
Fields:
- category: text ("Men's Clothing")
- currency: keyword ("EUR")
- customer_birth_date: date (null)
- customer_first_name: text ("Eddie")
- customer_full_name: text ("Eddie Underwood")
- customer_gender: keyword ("MALE")
- customer_id: keyword ("38")
- customer_last_name: text ("Underwood")
- customer_phone: keyword ("")
- day_of_week: keyword ("Monday")
- day_of_week_i: integer (0)
- email: keyword ("eddie@underwood-family.zzz")
- event.dataset: keyword ("sample_ecommerce")
- geoip.city_name: keyword ("Cairo")
- geoip.continent_name: keyword ("Africa")
- geoip.country_iso_code: keyword ("EG")
- geoip.location: geo_point ([object Object])
- geoip.region_name: keyword ("Cairo Governorate")
- manufacturer: text ("Elitelligence,Oceanavigations")
- order_date: date (2023-06-05T09:28:48+00:00)
- order_id: keyword ("584677")
- products._id: text (null)
- products.base_price: half_float (null)
- products.base_unit_price: half_float (null)
- products.category: text (null)
- products.created_on: date (null)
- products.discount_amount: half_float (null)
- products.discount_percentage: half_float (null)
- products.manufacturer: text (null)
- products.min_price: half_float (null)
- products.price: half_float (null)
- products.product_id: long (null)
- products.product_name: text (null)
- products.quantity: integer (null)
- products.sku: keyword (null)
- products.tax_amount: half_float (null)
- products.taxful_price: half_float (null)
- products.taxless_price: half_float (null)
- products.unit_discount_amount: half_float (null)
- sku: keyword ("ZO0549605496,ZO0299602996")
- taxful_total_price: half_float (36.98)
- taxless_total_price: half_float (36.98)
- total_quantity: integer (2)
- total_unique_products: integer (2)
- type: keyword ("order")
- user: keyword ("eddie")
PPL: source=\`ecommerce\` | where MATCH(\`category\`, 'clothing') AND \`order_date\` < DATE_SUB(NOW(), INTERVAL 7 DAY) | stats AVG(\`taxful_total_price\`) AS \`avg_price\`

Question: What is the average price of products ordered today by every 2 hours? index is 'ecommerce'
Fields:
- category: text ("Men's Clothing")
- currency: keyword ("EUR")
- customer_birth_date: date (null)
- customer_first_name: text ("Eddie")
- customer_full_name: text ("Eddie Underwood")
- customer_gender: keyword ("MALE")
- customer_id: keyword ("38")
- customer_last_name: text ("Underwood")
- customer_phone: keyword ("")
- day_of_week: keyword ("Monday")
- day_of_week_i: integer (0)
- email: keyword ("eddie@underwood-family.zzz")
- event.dataset: keyword ("sample_ecommerce")
- geoip.city_name: keyword ("Cairo")
- geoip.continent_name: keyword ("Africa")
- geoip.country_iso_code: keyword ("EG")
- geoip.location: geo_point ([object Object])
- geoip.region_name: keyword ("Cairo Governorate")
- manufacturer: text ("Elitelligence,Oceanavigations")
- order_date: date (2023-06-05T09:28:48+00:00)
- order_id: keyword ("584677")
- products._id: text (null)
- products.base_price: half_float (null)
- products.base_unit_price: half_float (null)
- products.category: text (null)
- products.created_on: date (null)
- products.discount_amount: half_float (null)
- products.discount_percentage: half_float (null)
- products.manufacturer: text (null)
- products.min_price: half_float (null)
- products.price: half_float (null)
- products.product_id: long (null)
- products.product_name: text (null)
- products.quantity: integer (null)
- products.sku: keyword (null)
- products.tax_amount: half_float (null)
- products.taxful_price: half_float (null)
- products.taxless_price: half_float (null)
- products.unit_discount_amount: half_float (null)
- sku: keyword ("ZO0549605496,ZO0299602996")
- taxful_total_price: half_float (36.98)
- taxless_total_price: half_float (36.98)
- total_quantity: integer (2)
- total_unique_products: integer (2)
- type: keyword ("order")
- user: keyword ("eddie")
PPL: source=\`ecommerce\` | where \`order_date\` < DATE_SUB(NOW(), INTERVAL 24 HOUR) | stats AVG(\`taxful_total_price\`) AS \`avg_price\` by SPAN(\`order_date\`, 2h)

----------------

Use the following steps to generate the PPL query:
#01 Find all entities in the question.
#02 Pick the fields that are relevant to the question from the provided fields list using entities.
#03 Use the choosen fields to write the PPL query.

Remember the rules when writing a PPL query:
#01 Always use comparisons to filter date/time, eg. 'where \`timestamp\` < DATE_SUB(NOW(), INTERVAL 1 DAY)'.
#02 Only use fields appeared in the question or in the provided fields list.
#03 Only use syntax and keywords appeared in the question or in the examples.

{format_instructions}

Question: {question}
`.trim();

const parser = StructuredOutputParser.fromNamesAndDescriptions({ query: 'This is a PPL query' });
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question'],
  partialVariables: { format_instructions: formatInstructions },
});

export const request = async (question: string) => {
  const chain = new LLMChain({ llm: llmModel.model, prompt });
  const output = await chain.call({ question });
  return parser.parse(output.text);
};
