/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */
import { AgentExecutor } from 'langchain/agents';
import { CallbackManagerForChainRun } from 'langchain/callbacks';
import { AgentAction, AgentFinish, AgentStep, ChainValues } from 'langchain/schema';
import { Tool } from 'langchain/tools';
import { PreservedInputTool } from '../../tools/preserved_input_tool';

// redefined some classes not exported from langchain

/**
 * Tool that just returns the query.
 * Used for exception tracking.
 */
class ExceptionTool extends Tool {
  name = '_Exception';

  description = 'Exception tool';

  async _call(query: string) {
    return query;
  }
}
class ToolInputParsingException extends Error {
  output?: string;

  constructor(message: string, output?: string) {
    super(message);
    this.output = output;
  }
}
class OutputParserException extends Error {
  llmOutput?: string;

  observation?: string;

  sendToLLM: boolean;

  constructor(message: string, llmOutput?: string, observation?: string, sendToLLM = false) {
    super(message);
    this.llmOutput = llmOutput;
    this.observation = observation;
    this.sendToLLM = sendToLLM;

    if (sendToLLM) {
      if (observation === undefined || llmOutput === undefined) {
        throw new Error(
          "Arguments 'observation' & 'llmOutput' are required if 'sendToLlm' is true"
        );
      }
    }
  }
}

/**
 * AgentExecutor that uses user question as tool input for {@link PreservedInputTool}.
 */
export class OpenSearchAgentExecutor extends AgentExecutor {
  async _call(inputs: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    const toolsByName = Object.fromEntries(this.tools.map((t) => [t.name.toLowerCase(), t]));
    const steps: AgentStep[] = [];
    let iterations = 0;

    const getOutput = async (finishStep: AgentFinish) => {
      const { returnValues } = finishStep;
      const additional = await this.agent.prepareForOutput(returnValues, steps);

      if (this.returnIntermediateSteps) {
        return { ...returnValues, intermediateSteps: steps, ...additional };
      }
      await runManager?.handleAgentEnd(finishStep);
      return { ...returnValues, ...additional };
    };

    while (this.maxIterations === undefined || iterations < this.maxIterations) {
      let output;
      try {
        output = await this.agent.plan(steps, inputs, runManager?.getChild());
      } catch (e) {
        if (e instanceof OutputParserException) {
          let observation;
          let text = e.message;
          if (this.handleParsingErrors === true) {
            if (e.sendToLLM) {
              observation = e.observation;
              text = e.llmOutput ?? '';
            } else {
              observation = 'Invalid or incomplete response';
            }
          } else if (typeof this.handleParsingErrors === 'string') {
            observation = this.handleParsingErrors;
          } else if (typeof this.handleParsingErrors === 'function') {
            observation = this.handleParsingErrors(e);
          } else {
            throw e;
          }
          output = {
            tool: '_Exception',
            toolInput: observation,
            log: text,
          } as AgentAction;
        } else {
          throw e;
        }
      }
      // Check if the agent has finished
      if ('returnValues' in output) {
        return getOutput(output);
      }

      let actions: AgentAction[];
      if (Array.isArray(output)) {
        actions = output as AgentAction[];
      } else {
        actions = [output as AgentAction];
      }

      const newSteps = await Promise.all(
        actions.map(async (action) => {
          await runManager?.handleAgentAction(action);
          const tool =
            action.tool === '_Exception'
              ? new ExceptionTool()
              : toolsByName[action.tool?.toLowerCase()];
          let observation;
          try {
            observation = tool
              ? await tool.call(
                  tool instanceof PreservedInputTool && inputs.input
                    ? inputs.input
                    : action.toolInput,
                  runManager?.getChild()
                )
              : `${action.tool} is not a valid tool, try another one.`;
          } catch (e) {
            if (e instanceof ToolInputParsingException) {
              if (this.handleParsingErrors === true) {
                observation = 'Invalid or incomplete tool input. Please try again.';
              } else if (typeof this.handleParsingErrors === 'string') {
                observation = this.handleParsingErrors;
              } else if (typeof this.handleParsingErrors === 'function') {
                observation = this.handleParsingErrors(e);
              } else {
                throw e;
              }
              observation = await new ExceptionTool().call(observation, runManager?.getChild());
              return { action, observation: observation ?? '' };
            }
          }

          return { action, observation: observation ?? '' };
        })
      );

      steps.push(...newSteps);

      const lastStep = steps[steps.length - 1];
      const lastTool = toolsByName[lastStep.action.tool?.toLowerCase()];

      if (lastTool?.returnDirect) {
        return getOutput({
          returnValues: { [this.agent.returnValues[0]]: lastStep.observation },
          log: '',
        });
      }

      iterations += 1;
    }

    const finish = await this.agent.returnStoppedResponse(this.earlyStoppingMethod, steps, inputs);

    return getOutput(finish);
  }
}
