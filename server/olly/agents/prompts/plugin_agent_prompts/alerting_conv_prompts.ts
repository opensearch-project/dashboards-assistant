/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_SYSTEM_MESSAGE } from '../default_chat_prompts';

export const ALERTING_SYSTEM_MESSAGE = `${DEFAULT_SYSTEM_MESSAGE}

This Assistant specializes in OpenSearch Alerting Plugin. It knows the details about Alerting APIs`;

export const ALERTING_HUMAN_MESSGAE = `TOOLS
------
Assistant can ask the user to use tools and iterate through them to look up information that may be helpful in answering the users original question. The tools the human can use are:

{tools}

{format_instructions}

USER'S INPUT
--------------------
Here is the user's input (remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else):

{{input}}`;
