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
} from '@elastic/eui';
import React, { Children, isValidElement, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Palantir as PalantirInput } from '../../types';
import { getPalantirRegistry, getChrome, getNotifications } from '../../services';

export interface PalantirProps {
  children: React.ReactNode;
}

// x button
// active state (remove anchor)
// saved objects
// handle bad unmounting of the popover when navigating away
// i18n
// onloadstate
// try for customer attribute
const container = document.createElement('div');
document.body.appendChild(container);

export const Palantir = ({ children }: PalantirProps) => {
  const anchor = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const logos = getChrome().logos;
  const toasts = getNotifications().toasts;
  const registry = getPalantirRegistry();
  let target: React.ReactNode;
  let input: PalantirInput;

  const findPalantir = (node: React.ReactNode): React.ReactNode => {
    try {
      if (!isValidElement(node)) return;
      if (node.key && registry.get(node.key as string)) {
        input = registry.get(node.key as string);
        target = node;
        return;
      }

      if (node.props.children) {
        Children.forEach(node.props.children, (child) => {
          findPalantir(child);
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

  const onSubmitClick = (palantir: PalantirInput, suggestion: string) => {
    setIsVisible(false);
    registry.open(palantir, suggestion);
  };

  const SuggestionsPopoverFooter: React.FC<{ palantir: PalantirInput }> = ({ palantir }) => (
    <EuiPopoverFooter className="palantirPopoverFooter" paddingSize="none">
      <EuiText size="xs" color="subdued">
        Available suggestions
      </EuiText>
      <EuiListGroup flush>
        {registry.getSuggestions(palantir.key).map((suggestion, index) => (
          <div key={`${palantir.key}-${index}-${palantir.interactionId}`}>
            <EuiSpacer size="xs" />
            <EuiListGroupItem
              label={suggestion}
              className="palantirSuggestionListItem"
              color="subdued"
              iconType="chatRight"
              iconProps={{ size: 's' }}
              onClick={() => onSubmitClick(palantir, suggestion)}
              aria-label={suggestion}
              wrapText
              size="xs"
              extraAction={{
                onClick: () => onSubmitClick(palantir, suggestion),
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

  const SummaryPopoverBody: React.FC<{ palantir: PalantirInput }> = ({ palantir }) => (
    <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="plain">
      <EuiText size="s">{palantir.summary}</EuiText>
    </EuiPanel>
  );

  const SummaryWithSuggestionsPopoverBody: React.FC<{ palantir: PalantirInput }> = ({
    palantir,
  }) => (
    <>
      {<SummaryPopoverBody palantir={palantir} />}
      {<SuggestionsPopoverFooter palantir={palantir} />}
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

  const ChatWithSuggestionsPopoverBody: React.FC<{ palantir: PalantirInput }> = ({ palantir }) => (
    <>
      {<ChatPopoverBody />}
      {<SuggestionsPopoverFooter palantir={palantir} />}
    </>
  );

  const renderAnchor = () => {
    if (!input || !target) return children;

    return (
      <EuiFlexGroup
        className="palantirAnchorButton"
        onKeyDown={onAnchorKeyPress}
        onClick={onAnchorClick}
        gutterSize="none"
        alignItems="center"
        ref={anchor}
      >
        <EuiFlexItem>
          <div className="palantirAnchorContent" ref={renderPopover}>
            {target}
          </div>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <div className="palantirAnchorIcon">
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
          return <SuggestionsPopoverFooter palantir={input} />;
        case 'generate':
          return <GeneratePopoverBody />;
        case 'summary':
          return <SummaryPopoverBody palantir={input} />;
        case 'summaryWithSuggestions':
          return <SummaryWithSuggestionsPopoverBody palantir={input} />;
        case 'chat':
          return <ChatPopoverBody />;
        case 'chatWithSuggestions':
          return <ChatWithSuggestionsPopoverBody palantir={input} />;
        default:
          return <SummaryWithSuggestionsPopoverBody palantir={input} />;
      }
    };

    const popover = (
      <EuiWrappingPopover
        key={input.key}
        button={anchor.current?.firstChild as HTMLElement}
        isOpen={isVisible}
        closePopover={closePopover}
        anchorClassName="palantirAnchor"
        anchorPosition="rightUp"
        offset={5}
        panelPaddingSize="s"
      >
        <EuiPopoverTitle className="palantirPopoverTitle" paddingSize="none">
          <EuiBadge color="hollow" iconType={logos.Chat.url} iconSide="left">
            OpenSearch Assistant
          </EuiBadge>
        </EuiPopoverTitle>
        <div className="palantirPopoverBody">{popoverBody()}</div>
      </EuiWrappingPopover>
    );

    ReactDOM.render(popover, container);
  };

  findPalantir(children);

  return <div>{renderAnchor()}</div>;
};

// eslint-disable-next-line import/no-default-export
export { Palantir as default };
