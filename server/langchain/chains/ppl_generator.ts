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

----------------
Here are some sample questions and the PPL query to retrieve the information.

Give me some documents in index 'accounts'
source=\`accounts\`

Give me 10 documents in index 'accounts'
source=\`accounts\` | head 10

Give me 5 oldest people in index 'accounts'
source=\`accounts\` | sort - age | head 5

Give me first names of 5 youngest people in index 'accounts'
source=\`accounts\` | sort age | head 5 | fields \`firstname\`

Give me some addresses in index 'accounts'. field for addresses is 'address'
source=\`accounts\` | fields \`address\`

Find the document in index 'accounts' where firstname is 'Hattie'
source=\`accounts\` | where \`firstname\` = 'Hattie'

Find the emails in index 'accounts' where firstname is 'Hattie' or lastname is 'Frank'. email field is 'email'
source=\`accounts\` | where \`firstname\` = 'Hattie' or \`lastname\` = 'frank' | fields \`email\`

Find the document in index 'accounts' where firstname is not 'Hattie' and lastname is not 'Frank'
source=\`accounts\` | where \`firstname\` != 'Hattie' and \`lastname\` != 'frank'

Count the number of documents in index 'accounts'
source=\`accounts\` | stats count() as count

Count the number of people with firstname 'Amber' in index 'accounts'
source=\`accounts\` | where \`firstname\` ='Amber' | stats count() as count

How many people are older than 33? index is 'accounts', age fields is 'age'
source=\`accounts\` | where \`age\` > 33 | stats count() as count

How many males and females in index 'accounts'? gender fields is 'gender'
source=\`accounts\` | stats count() as count by \`gender\`

What is the average, minimum, maximum age in 'accounts' index?
source=\`accounts\` | stats avg(\`age\`) as avg_age, min(\`age\`) as min_age, max(\`age\` as max_age

Show all states sorted by average balance. balance field is 'balance', states field is 'state', index is 'accounts'
source=\`accounts\` | stats avg(\`balance\`) as avg_balance by \`state\` | sort avg_balance

What is the average price of products ordered in the last 7 days? price field is 'taxful_total_price', ordered date field is 'order_date', index is 'ecommerce'
source=\`ecommerce\` | where \`order_date\` < DATE_SUB(NOW(), INTERVAL 7 DAY) | stats avg(\`taxful_total_price\`) as avg_price

What is the average price of products ordered in the last 24 hours by every 2 hours? price field is 'taxful_total_price', ordered date field is 'order_date', index is 'ecommerce'
source=\`ecommerce\` | where \`order_date\` < DATE_SUB(NOW(), INTERVAL 24 HOUR) | stats avg(\`taxful_total_price\`) as avg_price by span(\`order_date\`, 2h)

----------------

#01 For \`sort\` command, do not wrap backtick around the field
#02 For \`sort\` command, use \`sort - field\` instead of \`sort field desc\` to sort in descending order
#03 Only use fields that appear in the question

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
