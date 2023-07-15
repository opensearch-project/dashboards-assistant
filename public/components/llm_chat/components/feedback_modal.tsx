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
import { LANGCHAIN_API } from '../../../../common/constants/llm';
import { coreRefs } from '../../../framework/core_refs';

export interface FeedbackFormData {
  input: string;
  output: string;
  correct: boolean | undefined;
  expectedOutput: string;
  comment: string;
}

interface FeedbackMetaData {
  type: 'event_analytics' | 'chat';
  chatId?: string;
  sessionId?: string;
  error?: boolean;
  selectedIndex?: string;
}

interface FeedbackModelProps {
  input?: string;
  output?: string;
  metadata: FeedbackMetaData;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModelProps> = (props) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    input: props.input ?? '',
    output: props.output ?? '',
    correct: undefined,
    expectedOutput: '',
    comment: '',
  });
  return (
    <EuiModal onClose={props.onClose}>
      <FeedbackModalContent
        formData={formData}
        setFormData={setFormData}
        metadata={props.metadata}
        onClose={props.onClose}
      />
    </EuiModal>
  );
};

interface FeedbackModalContentProps {
  formData: FeedbackFormData;
  setFormData: React.Dispatch<React.SetStateAction<FeedbackFormData>>;
  metadata: FeedbackMetaData;
  displayLabels?: Partial<Record<keyof FeedbackFormData, string>>;
  onClose: () => void;
}

export const FeedbackModalContent: React.FC<FeedbackModalContentProps> = (props) => {
  const labels: NonNullable<Required<typeof props.displayLabels>> = Object.assign(
    {
      input: 'Input question',
      output: 'Output',
      correct: 'Does the output match your expectations?',
      expectedOutput: 'Expected output',
      comment: 'Comment',
    },
    props.displayLabels
  );
  const { loading, submitFeedback } = useSubmitFeedback(
    props.formData,
    props.metadata,
    coreRefs.http!
  );
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

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = {
      input: validator.input(props.formData.input),
      output: validator.output(props.formData.output),
      correct: validator.correct(props.formData.correct),
      expectedOutput: validator.expectedOutput(
        props.formData.expectedOutput,
        props.formData.correct === false
      ),
    };
    if (Object.values(errors).some((e) => !!e.length)) {
      setFormErrors(errors);
      return;
    }

    try {
      await submitFeedback();
      props.setFormData({
        input: '',
        output: '',
        correct: undefined,
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
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>LLM Feedback</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiForm
          isInvalid={hasError()}
          error={Object.values(formErrors).flat()}
          component="form"
          id="feedback-form"
          onSubmit={onSubmit}
        >
          <EuiFormRow label={labels.input} isInvalid={hasError('input')} error={formErrors.input}>
            <EuiTextArea
              compressed
              placeholder="Your input question"
              value={props.formData.input}
              onChange={(e) => props.setFormData({ ...props.formData, input: e.target.value })}
              onBlur={(e) => {
                setFormErrors({ ...formErrors, input: validator.input(e.target.value) });
              }}
              isInvalid={hasError('input')}
            />
          </EuiFormRow>
          <EuiFormRow
            label={labels.output}
            isInvalid={hasError('output')}
            error={formErrors.output}
          >
            <EuiTextArea
              compressed
              placeholder="The LLM response"
              value={props.formData.output}
              onChange={(e) => props.setFormData({ ...props.formData, output: e.target.value })}
              onBlur={(e) => {
                setFormErrors({ ...formErrors, output: validator.output(e.target.value) });
              }}
              isInvalid={hasError('output')}
            />
          </EuiFormRow>
          <EuiFormRow
            label={labels.correct}
            isInvalid={hasError('correct')}
            error={formErrors.correct}
          >
            <EuiRadioGroup
              options={[
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
              ]}
              idSelected={
                props.formData.correct === undefined
                  ? undefined
                  : props.formData.correct === true
                  ? 'yes'
                  : 'no'
              }
              onChange={(id) => {
                props.setFormData({ ...props.formData, correct: id === 'yes' });
                setFormErrors({ ...formErrors, expectedOutput: [] });
              }}
              onBlur={() => setFormErrors({ ...formErrors, correct: [] })}
            />
          </EuiFormRow>
          {props.formData.correct === false && (
            <EuiFormRow
              label={labels.expectedOutput}
              isInvalid={hasError('expectedOutput')}
              error={formErrors.expectedOutput}
            >
              <EuiTextArea
                compressed
                placeholder="The expected response from LLM"
                value={props.formData.expectedOutput}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, expectedOutput: e.target.value })
                }
                onBlur={(e) => {
                  setFormErrors({
                    ...formErrors,
                    expectedOutput: validator.expectedOutput(
                      e.target.value,
                      props.formData.correct === false
                    ),
                  });
                }}
                isInvalid={hasError('expectedOutput')}
              />
            </EuiFormRow>
          )}
          <EuiFormRow label={labels.comment}>
            <EuiTextArea
              compressed
              placeholder="Additional feedback you would like to leave"
              value={props.formData.comment}
              onChange={(e) => props.setFormData({ ...props.formData, comment: e.target.value })}
            />
          </EuiFormRow>
        </EuiForm>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={props.onClose}>Cancel</EuiButtonEmpty>
        <EuiButton type="submit" form="feedback-form" fill isLoading={loading}>
          Send
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};

const useSubmitFeedback = (data: FeedbackFormData, metadata: FeedbackMetaData, http: HttpStart) => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    submitFeedback: () => {
      setLoading(true);
      return http
        .post(LANGCHAIN_API.FEEDBACK, { body: JSON.stringify({ metadata, ...data }) })
        .finally(() => setLoading(false));
    },
  };
};

const validator = {
  input: (text: string) => (text.trim().length === 0 ? ['Input is required'] : []),
  output: (text: string) => (text.trim().length === 0 ? ['Output is required'] : []),
  correct: (correct: boolean | undefined) =>
    correct === undefined ? ['Correctness is required'] : [],
  expectedOutput: (text: string, required: boolean) =>
    required && text.trim().length === 0 ? ['expectedOutput is required'] : [],
};
