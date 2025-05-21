/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCheckableCard,
  EuiFormFieldset,
  EuiSpacer,
  EuiTitle,
  htmlIdGenerator,
} from '@elastic/eui';
import React from 'react';

interface Props {
  title: string;
  items: string[];
  selection: string[];
  onToggle: (item: string) => void;
}

export const CheckableDataList = (props: Props) => {
  return (
    <div>
      <EuiFormFieldset
        legend={{
          children: (
            <EuiTitle size="xs">
              <span>{props.title}</span>
            </EuiTitle>
          ),
        }}
      >
        {props.items.map((item) => (
          <>
            <EuiCheckableCard
              id={htmlIdGenerator()()}
              label={item}
              checkableType="checkbox"
              value={item}
              checked={props.selection.includes(item)}
              onChange={() => props.onToggle(item)}
            />
            <EuiSpacer size="m" />
          </>
        ))}
      </EuiFormFieldset>
    </div>
  );
};
