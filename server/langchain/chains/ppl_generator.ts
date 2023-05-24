import { LLMChain } from 'langchain/chains';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { llmModel } from '../models/llm_model';
import { wrap } from '../utils/utils';

const template = `
You will be given a question about some metrics from a user.
Use context provided to write a PPL query that can be used to retrieve the information.

----------------
Here are some sample questions and the PPL query to retrieve the information.

Give me some documents in index 'accounts'
source=${wrap('accounts')}

Give me 10 documents in index 'accounts'
source=${wrap('accounts')} | head 10

Give me 5 oldest people in index 'accounts'
source=${wrap('accounts')} | sort - age | head 5

Give me first names of 5 youngest people in index 'accounts'
source=${wrap('accounts')} | sort age | head 5 | fields ${wrap('firstname')}

Give me some addresses in index 'accounts'. field for addresses is 'address'
source=${wrap('accounts')} | fields ${wrap('address')}

Find the document in index 'accounts' where firstname is 'Hattie'
source=${wrap('accounts')} | where ${wrap('firstname')} = 'Hattie'

Find the emails in index 'accounts' where firstname is 'Hattie' or lastname is 'Frank'. email field is 'email'
source=${wrap('accounts')} | where ${wrap('firstname')} = 'Hattie' or ${wrap(
  'lastname'
)} = 'frank' | fields ${wrap('email')}

Find the document in index 'accounts' where firstname is not 'Hattie' and lastname is not 'Frank'
source=${wrap('accounts')} | where ${wrap('firstname')} != 'Hattie' and ${wrap(
  'lastname'
)} != 'frank'

Count the number of documents in index 'accounts'
source=${wrap('accounts')} | stats count() as count

Count the number of people with firstname 'Amber' in index 'accounts'
source=${wrap('accounts')} | where ${wrap('firstname')} ='Amber' | stats count() as count

How many people are older than 33? index is 'accounts', age fields is 'age'
source=${wrap('accounts')} | where ${wrap('age')} > 33 | stats count() as count

How many males and females in index 'accounts'? gender fields is 'gender'
source=${wrap('accounts')} | stats count() as count by ${wrap('gender')}

What is the average, minimum, maximum age in 'accounts' index?
source=${wrap('accounts')} | stats avg(${wrap('age')}) as avg_age, min(${wrap(
  'age'
)}) as min_age, max(${wrap('age')} as max_age

Show all states sorted by average balance. balance field is 'balance', states field is 'state', index is 'accounts'
source=${wrap('accounts')} | stats avg(${wrap('balance')}) as avg_balance by ${wrap(
  'state'
)} | sort avg_balance

What is the average price of products ordered in the last 7 days? price field is 'taxful_total_price', ordered date field is 'order_date', index is 'ecommerce'
source=${wrap('ecommerce')} | where ${wrap(
  'order_date'
)} < DATE_SUB(NOW(), INTERVAL 7 DAY) | stats avg(${wrap('taxful_total_price')}) as avg_price

What is the average price of products ordered in the last 24 hours by every 2 hours? price field is 'taxful_total_price', ordered date field is 'order_date', index is 'ecommerce'
source=${wrap('ecommerce')} | where ${wrap(
  'order_date'
)} < DATE_SUB(NOW(), INTERVAL 24 HOUR) | stats avg(${wrap(
  'taxful_total_price'
)}) as avg_price by span(${wrap('order_date')}, 2h)

----------------

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
