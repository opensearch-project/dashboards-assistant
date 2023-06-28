/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiRadioGroup,
  EuiTextArea,
} from '@elastic/eui';
import React, { useState } from 'react';
import { HttpStart } from '../../../../../../src/core/public';
import { CHAT_API } from '../../../../common/constants/llm';
import { coreRefs } from '../../../framework/core_refs';

export interface FeedbackFormData {
  type: 'event_analytics' | 'chat';
  input: string;
  output: string;
  correct: boolean;
  expectedOutput: string;
  comment: string;
}

interface FeedbackModelProps {
  data: FeedbackFormData;
  setData: React.Dispatch<React.SetStateAction<FeedbackFormData>>;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModelProps> = (props) => {
  const { loading, submitFeedback } = useSubmitFeedback(props.data, coreRefs.http!);
  const [formErrors, setFormErrors] = useState<
    Partial<{ [x in keyof FeedbackFormData]: string[] }>
  >({
    input: [],
    output: [],
    expectedOutput: [],
  });

  const hasError = (key?: keyof FeedbackFormData) => {
    if (!key) return Object.values(formErrors).some((e) => !!e.length);
    return !!formErrors[key]?.length;
  };

  const submit = async () => {
    const errors = {
      input: validator.input(props.data.input),
      output: validator.output(props.data.output),
      expectedOutput: validator.expectedOutput(props.data.expectedOutput, !props.data.correct),
    };
    if (Object.values(errors).some((e) => !!e.length)) {
      setFormErrors(errors);
      return;
    }

    try {
      await submitFeedback();
      props.setData({
        type: 'event_analytics',
        input: '',
        output: '',
        correct: true,
        expectedOutput: '',
        comment: '',
      });
      coreRefs.toasts?.addSuccess('Thanks for your feedback!');
      props.onClose();
    } catch (e) {
      coreRefs.toasts?.addError(e, { title: 'Failed to submit feedback' });
    }
  };

  return (
    <EuiModal onClose={props.onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>LLM Feedback</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiForm
          isInvalid={hasError()}
          error={Object.values(formErrors).flat()}
          component="form"
          id="feedback-form"
        >
          <EuiFormRow label="Input question" isInvalid={hasError('input')} error={formErrors.input}>
            <EuiTextArea
              compressed
              placeholder="Your input question"
              value={props.data.input}
              onChange={(e) => props.setData({ ...props.data, input: e.target.value })}
              onBlur={(e) => {
                setFormErrors({ ...formErrors, input: validator.input(e.target.value) });
              }}
              isInvalid={hasError('input')}
            />
          </EuiFormRow>
          <EuiFormRow label="Output" isInvalid={hasError('output')} error={formErrors.output}>
            <EuiTextArea
              compressed
              placeholder="The LLM response"
              value={props.data.output}
              onChange={(e) => props.setData({ ...props.data, output: e.target.value })}
              onBlur={(e) => {
                setFormErrors({ ...formErrors, output: validator.output(e.target.value) });
              }}
              isInvalid={hasError('output')}
            />
          </EuiFormRow>
          <EuiFormRow label="Does the output match your expectations?">
            <EuiRadioGroup
              options={[
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
              ]}
              idSelected={props.data.correct ? 'yes' : 'no'}
              onChange={(id) => {
                props.setData({ ...props.data, correct: id === 'yes' });
                setFormErrors({ ...formErrors, expectedOutput: [] });
              }}
            />
          </EuiFormRow>
          {props.data.correct || (
            <EuiFormRow
              label="Expected output"
              isInvalid={hasError('expectedOutput')}
              error={formErrors.expectedOutput}
            >
              <EuiTextArea
                compressed
                placeholder="The expected response from LLM"
                value={props.data.expectedOutput}
                onChange={(e) => props.setData({ ...props.data, expectedOutput: e.target.value })}
                onBlur={(e) => {
                  setFormErrors({
                    ...formErrors,
                    expectedOutput: validator.expectedOutput(e.target.value, !props.data.correct),
                  });
                }}
                isInvalid={hasError('expectedOutput')}
              />
            </EuiFormRow>
          )}
          <EuiFormRow label="Comment">
            <EuiTextArea
              compressed
              placeholder="Additional feedback you would like to leave"
              value={props.data.comment}
              onChange={(e) => props.setData({ ...props.data, comment: e.target.value })}
            />
          </EuiFormRow>
        </EuiForm>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={props.onClose}>Cancel</EuiButtonEmpty>
        <EuiButton onClick={submit} fill isLoading={loading}>
          Send
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

const useSubmitFeedback = (data: FeedbackFormData, http: HttpStart) => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    submitFeedback: () => {
      setLoading(true);
      return http
        .post(CHAT_API.FEEDBACK, { body: JSON.stringify(data) })
        .finally(() => setLoading(false));
    },
  };
};

const validator = {
  input: (text: string) => (text.trim().length === 0 ? ['Input is required'] : []),
  output: (text: string) => (text.trim().length === 0 ? ['Output is required'] : []),
  expectedOutput: (text: string, required: boolean) =>
    required && text.trim().length === 0 ? ['expectedOutput is required'] : [],
};
