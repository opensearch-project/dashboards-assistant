/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButton, EuiButtonEmpty, EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';

import { debounceTime } from 'rxjs/operators';
import { CodeEditor } from '../../../../../src/plugins/opensearch_dashboards_react/public';

interface Props {
  originalValue: string;
  onApply: (value: string) => void;
}

export const EditorPanel = (props: Props) => {
  const [autoUpdate, setAutoUpdate] = useState(false);
  const editorInputRef = useRef(new BehaviorSubject(''));
  const editorInput = useObservable(editorInputRef.current) ?? '';

  const editInputChanged = props.originalValue !== editorInput;

  useEffect(() => {
    if (props.originalValue !== editorInputRef.current.value) {
      editorInputRef.current.next(props.originalValue);
    }
  }, [props.originalValue]);

  useEffect(() => {
    if (!autoUpdate) {
      return;
    }
    const subscription = editorInputRef.current.pipe(debounceTime(1000)).subscribe((value) => {
      props.onApply(value);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [autoUpdate, props.onApply]);

  return (
    <>
      <div style={{ height: 'calc(100% - 40px)' }}>
        <CodeEditor
          languageId="xjson"
          languageConfiguration={{
            autoClosingPairs: [
              {
                open: '(',
                close: ')',
              },
              {
                open: '"',
                close: '"',
              },
            ],
          }}
          value={editorInput}
          onChange={(v) => editorInputRef.current.next(v)}
          options={{
            readOnly: false,
            lineNumbers: 'on',
            fontSize: 12,
            minimap: {
              enabled: false,
            },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            folding: true,
            automaticLayout: true,
          }}
        />
      </div>
      <EuiFlexGroup alignItems="flexStart" gutterSize="s" style={{ height: 40, paddingTop: 8 }}>
        {!autoUpdate && (
          <>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                disabled={!editInputChanged}
                iconType="cross"
                onClick={() => editorInputRef.current.next(props.originalValue)}
              >
                {i18n.translate('dashboardAssistant.feature.text2viz.discardVegaSpecChange', {
                  defaultMessage: 'Discard',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: 'auto' }}>
              <EuiButton
                fill
                disabled={!editInputChanged}
                size="s"
                iconType="play"
                onClick={() => props.onApply(editorInput)}
              >
                {i18n.translate('dashboardAssistant.feature.text2viz.updateVegaSpec', {
                  defaultMessage: 'Update',
                })}
              </EuiButton>
            </EuiFlexItem>
          </>
        )}
        <EuiFlexItem grow={false} style={autoUpdate ? { marginLeft: 'auto' } : {}}>
          <EuiButtonIcon
            aria-label="Apply auto refresh"
            display={autoUpdate ? 'fill' : 'base'}
            size="s"
            iconType="refresh"
            onClick={() => setAutoUpdate((v) => !v)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
