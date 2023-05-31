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

Here are some sample questions and the PPL query to retrieve the information.
Format for a field is:
- field_name: field_type (sample field value)
----------------

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
Response: field for age is 'age'

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
Response: field for addresses is 'address'

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
Response: field for firstname is 'firstname'

Question: Find the emails in index 'accounts' where firstname is 'Hattie' or lastname is 'Frank'
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
Response: field for email is 'email'', field for firstname is 'firstname', field for lastname is 'lastname'

Question: How many requests are being processed by the payment service per second?
Fields:
- duration: long (3453)
- flags: integer (null)
- logs.fields.key: keyword (null)
- logs.fields.tagType: keyword (null)
- logs.fields.value: keyword (null)
- logs.timestamp: long (null)
- operationName: keyword ("oteldemo.ShippingService/GetQuote")
- parentSpanID: keyword (null)
- process.serviceName: keyword ("checkoutservice")
- process.tag.container@id: keyword (null)
- process.tag.host@arch: keyword (null)
- process.tag.host@name: keyword ("25037baa8dce")
- process.tag.os@description: keyword ("Alpine Linux 3.17.3 (Linux 25037baa8dce 5.15.0-1031-aws #35-Ubuntu SMP Fri Feb 10 02:07:18 UTC 2023 x86_64)")
- process.tag.os@name: keyword (null)
- process.tag.os@type: keyword ("linux")
- process.tag.os@version: keyword (null)
- process.tag.process@command: keyword (null)
- process.tag.process@command_args: keyword ("["./checkoutservice"]")
- process.tag.process@command_line: keyword (null)
- process.tag.process@executable@name: keyword ("checkoutservice")
- process.tag.process@executable@path: keyword ("/usr/src/app/checkoutservice")
- process.tag.process@owner: keyword ("root")
- process.tag.process@pid: keyword ("1")
- process.tag.process@runtime@description: keyword ("go version go1.19.2 linux/amd64")
- process.tag.process@runtime@name: keyword ("go")
- process.tag.process@runtime@version: keyword ("go1.19.2")
- process.tag.service@instance@id: keyword (null)
- process.tag.service@namespace: keyword ("opentelemetry-demo")
- process.tag.telemetry@auto@version: keyword (null)
- process.tag.telemetry@sdk@language: keyword ("go")
- process.tag.telemetry@sdk@name: keyword ("opentelemetry")
- process.tag.telemetry@sdk@version: keyword ("1.10.0")
- process.tags.key: keyword (null)
- process.tags.tagType: keyword (null)
- process.tags.value: keyword (null)
- references.refType: keyword (null)
- references.spanID: keyword (null)
- references.traceID: keyword (null)
- spanID: keyword ("2b160cab5ae99e68")
- startTime: long (1684505239733457)
- startTimeMillis: date (1684505239733)
- tag.error: keyword (null)
- traceID: keyword ("7467d44c62e2c13b7333f4cbb2e49b46")
Response: field for timestamp is 'startTimeMillis', field for service is 'process.serviceName'

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
Response: gender field is 'gender'

Question: Show all states sorted by average balance
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
Response: states field is 'state', balance field is 'balance'

Question: What is the average price of products ordered in the last 7 days?
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
Response: price field is 'taxful_total_price', ordered date field is 'order_date'

Question: What are the top 5 customers spent the most?
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

export const request = async (question: string, fields: string) => {
  const chain = new LLMChain({ llm: llmModel.model, prompt });
  const output = await chain.call({ question, fields });
  return output.text as string;
};
