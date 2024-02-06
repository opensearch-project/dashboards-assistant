/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import {
  EuiWrappingPopover,
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPopoverTitle,
  EuiText,
  EuiPopoverFooter,
  EuiBadge,
  EuiSpacer,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  keys,
  EuiIcon,
  EuiButtonIcon,
} from '@elastic/eui';
import React, { Children, isValidElement, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getIncontextInsightRegistry, getChrome, getNotifications } from '../../services';

export interface IncontextInsightProps {
  children: React.ReactNode;
}

// TODO:
// Ask if arrow looks ok
// active state (remove anchor)
// saved objects / config
// handle bad unmounting of the popover when navigating away
// i18n
// onloadstate
// try for customer attribute
const container = document.createElement('div');
document.body.appendChild(container);

export const IncontextInsight = ({ children }: IncontextInsightProps) => {
  const anchor = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const logos = getChrome().logos;
  const toasts = getNotifications().toasts;
  const registry = getIncontextInsightRegistry();
  let target: React.ReactNode;
  let input: IncontextInsightInput;

  const findIncontextInsight = (node: React.ReactNode): React.ReactNode => {
    try {
      if (!isValidElement(node)) return;
      if (node.key && registry.get(node.key as string)) {
        input = registry.get(node.key as string);
        target = node;
        return;
      }

      if (node.props.children) {
        Children.forEach(node.props.children, (child) => {
          findIncontextInsight(child);
        });
      }
      if (!input) throw Error('Child key not found in registry.');
    } catch {
      return;
    }
  };

  const onAnchorClick = () => {
    setIsVisible(!isVisible);
  };

  const onAnchorKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === keys.TAB) {
      onAnchorClick();
    }
  };

  const closePopover = () => {
    setIsVisible(false);
  };

  const onSubmitClick = (incontextInsight: IncontextInsightInput, suggestion: string) => {
    setIsVisible(false);
    registry.open(incontextInsight, suggestion);
  };

  const SuggestionsPopoverFooter: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => (
    <EuiPopoverFooter className="incontextInsightPopoverFooter" paddingSize="none">
      <EuiText size="xs" color="subdued">
        Available suggestions
      </EuiText>
      <EuiListGroup flush>
        {registry.getSuggestions(incontextInsight.key).map((suggestion, index) => (
          <div key={`${incontextInsight.key}-${index}-${incontextInsight.interactionId}`}>
            <EuiSpacer size="xs" />
            <EuiListGroupItem
              label={suggestion}
              className="incontextInsightSuggestionListItem"
              color="subdued"
              iconType="chatRight"
              iconProps={{ size: 's' }}
              onClick={() => onSubmitClick(incontextInsight, suggestion)}
              aria-label={suggestion}
              wrapText
              size="xs"
              extraAction={{
                onClick: () => onSubmitClick(incontextInsight, suggestion),
                iconType: 'sortRight',
                iconSize: 's',
                alwaysShow: true,
                color: 'subdued',
              }}
            />
          </div>
        ))}
      </EuiListGroup>
    </EuiPopoverFooter>
  );

  const GeneratePopoverBody: React.FC<{}> = ({}) => (
    <EuiButton onClick={() => toasts.addDanger('To be implemented...')}>Generate summary</EuiButton>
  );

  const SummaryPopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => (
    <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="plain">
      <EuiText size="s">{incontextInsight.summary}</EuiText>
    </EuiPanel>
  );

  const SummaryWithSuggestionsPopoverBody: React.FC<{
    incontextInsight: IncontextInsightInput;
  }> = ({ incontextInsight }) => (
    <>
      {<SummaryPopoverBody incontextInsight={incontextInsight} />}
      {<SuggestionsPopoverFooter incontextInsight={incontextInsight} />}
    </>
  );

  const ChatPopoverBody: React.FC<{}> = ({}) => (
    <EuiFlexGroup>
      <EuiFlexItem grow={6}>
        <EuiFormRow>
          <EuiFieldText placeholder="Ask a question" />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          fill
          iconType="returnKey"
          iconSide="right"
          onClick={() => toasts.addDanger('To be implemented...')}
        >
          Go
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const ChatWithSuggestionsPopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => (
    <>
      {<ChatPopoverBody />}
      {<SuggestionsPopoverFooter incontextInsight={incontextInsight} />}
    </>
  );

  const renderAnchor = () => {
    if (!input || !target) return children;

    return (
      <EuiFlexGroup
        className="incontextInsightAnchorButton"
        onKeyDown={onAnchorKeyPress}
        onClick={onAnchorClick}
        gutterSize="none"
        alignItems="center"
        ref={anchor}
      >
        <EuiFlexItem>
          <div className="incontextInsightAnchorContent" ref={renderPopover}>
            {target}
          </div>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <div className="incontextInsightAnchorIcon">
            <EuiIcon type={logos.Chat.url} size="l" />
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderPopover = () => {
    if (!input || !target || !anchor.current) return children;
    const popoverBody = () => {
      switch (input.type) {
        case 'suggestions':
          return <SuggestionsPopoverFooter incontextInsight={input} />;
        case 'generate':
          return <GeneratePopoverBody />;
        case 'summary':
          return <SummaryPopoverBody incontextInsight={input} />;
        case 'summaryWithSuggestions':
          return <SummaryWithSuggestionsPopoverBody incontextInsight={input} />;
        case 'chat':
          return <ChatPopoverBody />;
        case 'chatWithSuggestions':
          return <ChatWithSuggestionsPopoverBody incontextInsight={input} />;
        default:
          return <SummaryWithSuggestionsPopoverBody incontextInsight={input} />;
      }
    };

    const popover = (
      <EuiWrappingPopover
        key={input.key}
        button={anchor.current?.firstChild as HTMLElement}
        isOpen={isVisible}
        closePopover={closePopover}
        anchorClassName="incontextInsightAnchor"
        anchorPosition="rightUp"
        offset={5}
        panelPaddingSize="s"
      >
        <EuiPopoverTitle className="incontextInsightPopoverTitle" paddingSize="none">
          <EuiFlexGroup gutterSize="none">
            <EuiFlexItem>
              <div>
                <EuiBadge color="hollow" iconType={logos.Chat.url} iconSide="left">
                  OpenSearch Assistant
                </EuiBadge>
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div>
                <EuiButtonIcon
                  title="Close assistant popover"
                  aria-label="Close assistant popover"
                  iconType="cross"
                  onClick={closePopover}
                  color="subdued"
                />
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPopoverTitle>
        <div className="incontextInsightPopoverBody">{popoverBody()}</div>
      </EuiWrappingPopover>
    );

    ReactDOM.render(popover, container);
  };

  findIncontextInsight(children);

  return <div>{renderAnchor()}</div>;
};

// eslint-disable-next-line import/no-default-export
export { IncontextInsight as default };
