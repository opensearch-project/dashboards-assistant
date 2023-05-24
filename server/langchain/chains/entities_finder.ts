import { LLMChain } from 'langchain/chains';
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
- account_number
- balance
- firstname
- lastname
- age
- gender
- address
- employer
- email
- city
- state
Response: field for age is 'age'

Question: Give me some addresses in index 'accounts'
Fields:
- account_number
- balance
- firstname
- lastname
- age
- gender
- address
- employer
- email
- city
- state
Response: field for addresses is 'address'

Question: Find the document in index 'accounts' where firstname is 'Hattie'
Fields:
- account_number
- balance
- firstname
- lastname
- age
- gender
- address
- employer
- email
- city
- state
Response: field for firstname is 'firstname'

Question: Find the emails in index 'accounts' where firstname is 'Hattie' or lastname is 'Frank'
Fields:
- account_number
- balance
- firstname
- lastname
- age
- gender
- address
- employer
- email
- city
- state
Response: field for email is 'email'', field for firstname is 'firstname', field for lastname is 'lastname'

Question: How many requests are being processed by the payment service per second?
Fields:
- duration
- flags
- logs
- operationName
- parentSpanID
- process
- references
- spanID
- startTime
- startTimeMillis
- tag
- tags
- traceID
- process.serviceName
Response: field for timestamp is 'startTime', field for service is 'process.serviceName'

Question: How many males and females in index 'accounts'?
Fields:
- account_number
- balance
- firstname
- lastname
- age
- gender
- address
- employer
- email
- city
- state
Response: gender field is 'gender'

Question: Show all states sorted by average balance
Fields:
- account_number
- balance
- firstname
- lastname
- age
- gender
- address
- employer
- email
- city
- state
Response: states field is 'state', balance field is 'balance'

Question: What is the average price of products ordered in the last 7 days?
Fields:
- category
- currency
- customer_birth_date
- customer_first_name
- customer_full_name
- customer_gender
- customer_id
- customer_last_name
- customer_phone
- day_of_week
- day_of_week_i
- email
- event
- geoip
- manufacturer
- order_date
- order_id
- products
- sku
- taxful_total_price
- taxless_total_price
- total_quantity
- total_unique_products
- type
- user
Response: price field is 'taxful_total_price', ordered date field is 'order_date'

Question: What are the top 5 customers spent the most?
Fields:
- category
- currency
- customer_birth_date
- customer_first_name
- customer_full_name
- customer_gender
- customer_id
- customer_last_name
- customer_phone
- day_of_week
- day_of_week_i
- email
- event
- geoip
- manufacturer
- order_date
- order_id
- products
- sku
- taxful_total_price
- taxless_total_price
- total_quantity
- total_unique_products
- type
- user
Response: spending field is 'taxful_total_price', customer field is 'customer_id'

----------------

Question: {question}
Fields:
{fields}
Response:
`.trim();

const prompt = new PromptTemplate({ template, inputVariables: ['question', 'fields'] });

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
