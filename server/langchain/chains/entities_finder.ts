/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LLMChain } from 'langchain/chains';
import { CommaSeparatedListOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { llmModel } from '../models/llm_model';

// TODO change to example_selectors? https://js.langchain.com/docs/modules/prompts/example_selectors/
const template = `
You will be given a question and index fields from a user.
Find all entities in the question, then correlate with fields to find the value of each entity.

----------------
Here are some sample questions and the PPL query to retrieve the information.

Question: Give me 5 oldest people in index 'accounts'
Fields:
- account_number: long
- address: text
- age: long
- balance: long
- city: text
- email: text
- employer: text
- firstname: text
- gender: text
- lastname: text
- state: text
Response: field for age is 'age'

Question: Give me some addresses in index 'accounts'
Fields:
- account_number: long
- address: text
- age: long
- balance: long
- city: text
- email: text
- employer: text
- firstname: text
- gender: text
- lastname: text
- state: text
Response: field for addresses is 'address'

Question: Find the document in index 'accounts' where firstname is 'Hattie'
Fields:
- account_number: long
- address: text
- age: long
- balance: long
- city: text
- email: text
- employer: text
- firstname: text
- gender: text
- lastname: text
- state: text
Response: field for firstname is 'firstname'

Question: Find the emails in index 'accounts' where firstname is 'Hattie' or lastname is 'Frank'
Fields:
- account_number: long
- address: text
- age: long
- balance: long
- city: text
- email: text
- employer: text
- firstname: text
- gender: text
- lastname: text
- state: text
Response: field for email is 'email'', field for firstname is 'firstname', field for lastname is 'lastname'

Question: How many requests are being processed by the payment service per second?
Fields:
- duration: long
- flags: integer
- logs.fields.key: keyword
- logs.fields.tagType: keyword
- logs.fields.value: keyword
- logs.timestamp: long
- operationName: keyword
- parentSpanID: keyword
- process.serviceName: keyword
- process.tag.container@id: keyword
- process.tags.key: keyword
- process.tags.tagType: keyword
- process.tags.value: keyword
- references.refType: keyword
- references.spanID: keyword
- references.traceID: keyword
- spanID: keyword
- startTime: long
- startTimeMillis: date
- tag.app@ads@ad_request_type: keyword
- tag.decode_time_microseconds: keyword
- tag.error: keyword
- tag.http@client_ip: keyword
- tag.idle_ns: keyword
- tag.idle_time_microseconds: keyword
- tag.internal@span@format: keyword
- tag.query_time_microseconds: keyword
- tag.queue_time_microseconds: keyword
- tag.source: keyword
- tag.span@kind: keyword
- tag.total_time_microseconds: keyword
- tags.key: keyword
- tags.tagType: keyword
- tags.value: keyword
- traceID: keyword
Response: field for timestamp is 'startTimeMillis', field for service is 'process.serviceName'

Question: How many males and females in index 'accounts'?
Fields:
- account_number: long
- address: text
- age: long
- balance: long
- city: text
- email: text
- employer: text
- firstname: text
- gender: text
- lastname: text
- state: text
Response: gender field is 'gender'

Question: Show all states sorted by average balance
Fields:
- account_number: long
- address: text
- age: long
- balance: long
- city: text
- email: text
- employer: text
- firstname: text
- gender: text
- lastname: text
- state: text
Response: states field is 'state', balance field is 'balance'

Question: What is the average price of products ordered in the last 7 days?
Fields:
- category: text
- currency: keyword
- customer_birth_date: date
- customer_first_name: text
- customer_full_name: text
- customer_gender: keyword
- customer_id: keyword
- customer_last_name: text
- customer_phone: keyword
- day_of_week: keyword
- day_of_week_i: integer
- email: keyword
- event.dataset: keyword
- geoip.city_name: keyword
- geoip.continent_name: keyword
- geoip.country_iso_code: keyword
- geoip.location: geo_point
- geoip.region_name: keyword
- manufacturer: text
- order_date: date
- order_id: keyword
- products._id: text
- products.base_price: half_float
- products.base_unit_price: half_float
- products.category: text
- products.created_on: date
- products.discount_amount: half_float
- products.discount_percentage: half_float
- products.manufacturer: text
- products.min_price: half_float
- products.price: half_float
- products.product_id: long
- products.product_name: text
- products.quantity: integer
- products.sku: keyword
- products.tax_amount: half_float
- products.taxful_price: half_float
- products.taxless_price: half_float
- products.unit_discount_amount: half_float
- sku: keyword
- taxful_total_price: half_float
- taxless_total_price: half_float
- total_quantity: integer
- total_unique_products: integer
- type: keyword
- user: keyword
Response: price field is 'taxful_total_price', ordered date field is 'order_date'

Question: What are the top 5 customers spent the most?
Fields:
- category: text
- currency: keyword
- customer_birth_date: date
- customer_first_name: text
- customer_full_name: text
- customer_gender: keyword
- customer_id: keyword
- customer_last_name: text
- customer_phone: keyword
- day_of_week: keyword
- day_of_week_i: integer
- email: keyword
- event.dataset: keyword
- geoip.city_name: keyword
- geoip.continent_name: keyword
- geoip.country_iso_code: keyword
- geoip.location: geo_point
- geoip.region_name: keyword
- manufacturer: text
- order_date: date
- order_id: keyword
- products._id: text
- products.base_price: half_float
- products.base_unit_price: half_float
- products.category: text
- products.created_on: date
- products.discount_amount: half_float
- products.discount_percentage: half_float
- products.manufacturer: text
- products.min_price: half_float
- products.price: half_float
- products.product_id: long
- products.product_name: text
- products.quantity: integer
- products.sku: keyword
- products.tax_amount: half_float
- products.taxful_price: half_float
- products.taxless_price: half_float
- products.unit_discount_amount: half_float
- sku: keyword
- taxful_total_price: half_float
- taxless_total_price: half_float
- total_quantity: integer
- total_unique_products: integer
- type: keyword
- user: keyword
Response: spending field is 'taxful_total_price', customer field is 'customer_id'

----------------

Always give a date field if exists.

Your response should be a list of comma separated values, eg: \`foo field is 'foo', bar field is 'bar', baz field is 'baz'\`

Question: {question}
Fields:
{fields}
Response:
`.trim();

const parser = new CommaSeparatedListOutputParser();
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question', 'fields'],
  partialVariables: { format_instructions: formatInstructions },
});

export const request = async (question: string, fields: Record<string, string>) => {
  const chain = new LLMChain({ llm: llmModel.model, prompt });
  const output = await chain.call({
    question,
    fields: Object.entries(fields)
      .map(([field, type]) => `- ${field}: ${type}`)
      .join('\n'),
  });
  return output.text as string;
};
