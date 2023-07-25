/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { LLMChain } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';

const template = `
You will be given a question about some metrics from a user.
Use context provided to write a PPL query that can be used to retrieve the information.

Here is a sample PPL query:
source=\`<index>\` | where \`<field>\` = '\`<value>\`'

Here are some sample questions and the PPL query to retrieve the information. The format for fields is
\`\`\`
- field_name: field_type (sample field value)
\`\`\`

For example, below is a field called \`timestamp\`, it has a field type of \`date\`, and a sample value of it could look like \`1686000665919\`.
\`\`\`
- timestamp: date (1686000665919)
\`\`\`
----------------

The following text contains fields and questions/answers for the 'accounts' index

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
- registered_at: date (1686000665919)

Question: Give me some documents in index 'accounts'
PPL: source=\`accounts\` | head

Question: Give me 5 oldest people in index 'accounts'
PPL: source=\`accounts\` | sort -age | head 5

Question: Give me first names of 5 youngest people in index 'accounts'
PPL: source=\`accounts\` | sort +age | head 5 | fields \`firstname\`

Question: Give me some addresses in index 'accounts'
PPL: source=\`accounts\` | fields \`address\`

Question: Find the documents in index 'accounts' where firstname is 'Hattie'
PPL: source=\`accounts\` | where \`firstname\` = 'Hattie'

Question: Find the emails where firstname is 'Hattie' or lastname is 'Frank' in index 'accounts'
PPL: source=\`accounts\` | where \`firstname\` = 'Hattie' OR \`lastname\` = 'frank' | fields \`email\`

Question: Find the documents in index 'accounts' where firstname is not 'Hattie' and lastname is not 'Frank'
PPL: source=\`accounts\` | where \`firstname\` != 'Hattie' AND \`lastname\` != 'frank'

Question: Find the emails that contain '.com' in index 'accounts'
PPL: source=\`accounts\` | where MATCH(\`email\`, '.com') | fields \`email\`

Question: Find the documents in index 'accounts' where there is an email
PPL: source=\`accounts\` | where ISNOTNULL(\`email\`)

Question: Count the number of documents in index 'accounts'
PPL: source=\`accounts\` | stats COUNT() AS \`count\`

Question: Count the number of people with firstname 'Amber' in index 'accounts'
PPL: source=\`accounts\` | where \`firstname\` ='Amber' | stats COUNT() AS \`count\`

Question: How many people are older than 33? index is 'accounts'
PPL: source=\`accounts\` | where \`age\` > 33 | stats COUNT() AS \`count\`

Question: How many males and females in index 'accounts'?
PPL: source=\`accounts\` | stats COUNT() AS \`count\` BY \`gender\`

Question: What is the average, minimum, maximum age in 'accounts' index?
PPL: source=\`accounts\` | stats AVG(\`age\`) AS \`avg_age\`, MIN(\`age\`) AS \`min_age\`, MAX(\`age\`) AS \`max_age\`

Question: Show all states sorted by average balance. index is 'accounts'
PPL: source=\`accounts\` | stats AVG(\`balance\`) AS \`avg_balance\` BY \`state\` | sort +avg_balance

----------------

The following text contains fields and questions/answers for the 'ecommerce' index

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

Question: What is the average price of products in clothing category ordered in the last 7 days? index is 'ecommerce'
PPL: source=\`ecommerce\` | where MATCH(\`category\`, 'clothing') AND \`order_date\` < DATE_SUB(NOW(), INTERVAL 7 DAY) | stats AVG(\`taxful_total_price\`) AS \`avg_price\`

Question: What is the average price of products ordered today by every 2 hours? index is 'ecommerce'
PPL: source=\`ecommerce\` | where \`order_date\` < DATE_SUB(NOW(), INTERVAL 24 HOUR) | stats AVG(\`taxful_total_price\`) AS \`avg_price\` by SPAN(\`order_date\`, 2h)

Question: What is the total revenue of shoes each day in this week? index is 'ecommerce'
PPL: source=\`ecommerce\` | where MATCH(\`category\`, 'shoes') AND \`order_date\` < DATE_SUB(NOW(), INTERVAL 1 WEEK) | stats SUM(\`taxful_total_price\`) AS \`revenue\` by SPAN(\`order_date\`, 1d)

----------------

The following text contains fields and questions/answers for the 'events' index
Fields:
- timestamp: long (1686000665919)
- attributes.data_stream.dataset: text ("nginx.access")
- attributes.data_stream.namespace: text ("production")
- attributes.data_stream.type: text ("logs")
- body: text ("172.24.0.1 - - [02/Jun/2023:23:09:27 +0000] "GET / HTTP/1.1" 200 4955 "-" "Mozilla/5.0 zgrab/0.x"")
- communication.source.address: text ("127.0.0.1")
- communication.source.ip: text ("172.24.0.1")
- container_id: text (null)
- container_name: text (null)
- event.category: text ("web")
- event.domain: text ("nginx.access")
- event.kind: text ("event")
- event.name: text ("access")
- event.result: text ("success")
- event.type: text ("access")
- http.flavor: text ("1.1")
- http.request.method: text ("GET")
- http.response.bytes: long (4955)
- http.response.status_code: keyword ("200")
- http.url: text ("/")
- log: text (null)
- observerTime: date (1686000665919)
- source: text (null)
- span_id: text ("abcdef1010")
- trace_id: text ("102981ABCD2901")

Question: What are recent logs with errors and contains word 'test'? index is 'events'
PPL: source=\`events\` | where \`http.response.status_code\` != "200" AND MATCH(\`body\`, 'test') AND \`observerTime\` < DATE_SUB(NOW(), INTERVAL 5 MINUTE)

Question: What are the top traces with largest bytes? index is 'events'
PPL: source=\`events\` | stats SUM(\`http.response.bytes\`) as \`sum_bytes\` by \`trace_id\` | sort -sum_bytes | head

Question: Give me log patterns? index is 'events'
PPL: source=\`events\` | patterns \`body\` | stats take(\`body\`, 1) as \`sample_pattern\` by \`patterns_field\` | fields \`sample_pattern\`

Question: Give me log patterns for logs with errors? index is 'events'
PPL: source=\`events\` | where \`http.response.status_code\` != "200" | patterns \`body\` | stats take(\`body\`, 1) as \`sample_pattern\` by \`patterns_field\` | fields \`sample_pattern\`

----------------

Use the following steps to generate the PPL query:

Step 1. Find all field entities in the question.

Step 2. Pick the fields that are relevant to the question from the provided fields list using entities. Rules:
#01 Consider the field name, the field type, and the sample value when picking relevant fields. For example, if you need to filter flights departed from 'JFK', look for a \`text\` or \`keyword\` field with a field name such as 'departedAirport', and the sample value should be a 3 letter IATA airport code. Similarly, if you need a date field, look for a relevant field name with type \`date\` and not \`long\`.
#02 You must pick a field with \`date\` type when filtering on date/time.
#03 You must pick a field with \`date\` type when aggregating by time interval.
#04 You must not use the sample value in PPL query, unless it is relevant to the question.
#05 You must only pick fields that are relevant, and must pick the whole field name from the fields list.
#06 You must not use fields that are not in the fields list.
#07 You must not use the sample values unless relevant to the question.
#08 You must pick the field that contains a log line when asked about log patterns. Usually it is one of \`log\`, \`body\`, \`message\`.

Step 3. Use the choosen fields to write the PPL query. Rules:
#01 Always use comparisons to filter date/time, eg. 'where \`timestamp\` < DATE_SUB(NOW(), INTERVAL 1 DAY)'.
#02 Only use PPL syntax and keywords appeared in the question or in the examples.
#03 If user asks for current or recent status, filter the time field for last 5 minutes.
#04 The field used in 'SPAN(\`<field>\`, <interval>)' must have type \`date\`, not \`long\`.
#05 You must put values in quotes when filtering fields with \`text\` or \`keyword\` field type.

----------------
{format_instructions}
----------------

{question}
`.trim();

const parser = StructuredOutputParser.fromNamesAndDescriptions({ query: 'This is a PPL query' });
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template,
  inputVariables: ['question'],
  partialVariables: { format_instructions: formatInstructions },
});

export const requestPPLGeneratorChain = async (model: BaseLanguageModel, question: string) => {
  const chain = new LLMChain({ llm: model, prompt });
  const output = await chain.call({ question });
  return parser.parse(output.text);
};
