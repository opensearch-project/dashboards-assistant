/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCheckableCard,
  EuiFormFieldset,
  EuiLink,
  // EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
  // EuiToolTip,
  htmlIdGenerator,
} from '@elastic/eui';
import React from 'react';
import './checkable_data_list.scss';

interface Props {
  title: string;
  items: string[];
  selection: string[];
  onToggle: (item: string) => void;
  onSelectAllForCategory: () => void;
}

export const CheckableDataList = (props: Props) => {
  const allSelected = props.items.every((item) => props.selection.includes(item));

  return (
    <div className="checkable__page">
      <EuiFormFieldset
        legend={{
          children: (
            <EuiTitle size="xs">
              <span>
                {props.title}{' '}
                <EuiLink
                  className="checkable__selectAllContainer"
                  onClick={props.onSelectAllForCategory}
                  color="primary"
                  disabled={props.items.length === 0}
                >
                  <EuiText size="s">{allSelected ? 'Deselect all' : 'Select all'}</EuiText>
                </EuiLink>
              </span>
            </EuiTitle>
          ),
        }}
      >
        {props.items.map((item) => (
          <div key={item}>
            <EuiCheckableCard
              id={htmlIdGenerator()()}
              label={item}
              // Temporarily hide the preview icon
              // <div
              //   style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              // >
              //   <EuiToolTip content="Preview insight">
              //     <EuiIcon type="eye" style={{ marginLeft: '8px', cursor: 'pointer' }} />
              //   </EuiToolTip>
              // </div>
              checkableType="checkbox"
              value={item}
              checked={props.selection.includes(item)}
              onChange={() => props.onToggle(item)}
            />
            <EuiSpacer size="m" />
          </div>
        ))}
      </EuiFormFieldset>
    </div>
  );
};
