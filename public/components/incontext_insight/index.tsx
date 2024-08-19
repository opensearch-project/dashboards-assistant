/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { i18n } from '@osd/i18n';
import {
  EuiWrappingPopover,
  EuiSmallButton,
  EuiCompressedFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
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
  EuiSmallButtonIcon,
} from '@elastic/eui';
import React, { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getIncontextInsightRegistry, getNotifications } from '../../services';
// TODO: Replace with getChrome().logos.Chat.url
import chatIcon from '../../assets/chat.svg';

export interface IncontextInsightProps {
  children?: React.ReactNode;
}

// TODO: add saved objects / config to store seed suggestions
export const IncontextInsight = ({ children }: IncontextInsightProps) => {
  const anchor = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // TODO: use animation when not using display: none
    if (anchor.current) {
      const incontextInsightAnchorButtonClassList = anchor.current.parentElement?.querySelector(
        '.incontextInsightAnchorButton'
      )?.classList;
      const incontextInsightAnchorIconClassList = anchor.current.querySelector(
        '.incontextInsightAnchorIcon'
      )?.children[0].classList;

      if (!incontextInsightAnchorButtonClassList || !incontextInsightAnchorIconClassList) return;

      incontextInsightAnchorButtonClassList.add('incontextInsightHoverEffectUnderline');
      incontextInsightAnchorIconClassList.add(
        'incontextInsightHoverEffect0',
        'incontextInsightHoverEffect25',
        'incontextInsightHoverEffect50',
        'incontextInsightHoverEffect75',
        'incontextInsightHoverEffect100'
      );

      setTimeout(() => {
        let opacityLevel = 100;
        const intervalId = setInterval(() => {
          incontextInsightAnchorIconClassList.remove(`incontextInsightHoverEffect${opacityLevel}`);
          if (opacityLevel === 0) {
            incontextInsightAnchorButtonClassList.remove('incontextInsightHoverEffectUnderline');
            clearInterval(intervalId);
          }
          opacityLevel -= 25;
        }, 25);
      }, 1250);
    }
  }, []);

  const registry = getIncontextInsightRegistry();
  const toasts = getNotifications().toasts;
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
    if (anchor.current) {
      const incontextInsightAnchorButtonClassList = anchor.current.parentElement?.querySelector(
        '.incontextInsightAnchorButton'
      )?.classList;
      incontextInsightAnchorButtonClassList?.add('incontextInsightHoverEffectUnderline');
    }
  };

  const onAnchorKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === keys.TAB) {
      onAnchorClick();
    }
  };

  const closePopover = () => {
    setIsVisible(false);
    if (anchor.current) {
      const incontextInsightAnchorButtonClassList = anchor.current.parentElement?.querySelector(
        '.incontextInsightAnchorButton'
      )?.classList;
      incontextInsightAnchorButtonClassList?.remove('incontextInsightHoverEffectUnderline');
    }
  };

  const onSubmitClick = (incontextInsight: IncontextInsightInput, suggestion: string) => {
    setIsVisible(false);
    registry.open(incontextInsight, suggestion);
    if (anchor.current) {
      const incontextInsightAnchorButtonClassList = anchor.current.parentElement?.querySelector(
        '.incontextInsightAnchorButton'
      )?.classList;
      incontextInsightAnchorButtonClassList?.remove('incontextInsightHoverEffectUnderline');
    }
  };

  const SuggestionsPopoverFooter: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => (
    <EuiPopoverFooter className="incontextInsightPopoverFooter" paddingSize="none">
      <EuiText size="xs" color="subdued">
        {i18n.translate('assistantDashboards.incontextInsight.availableSuggestions', {
          defaultMessage: 'Available suggestions',
        })}
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
    <EuiSmallButton onClick={() => toasts.addDanger('To be implemented...')}>
      Generate summary
    </EuiSmallButton>
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
        <EuiCompressedFormRow>
          <EuiCompressedFieldText placeholder="Ask a question" />
        </EuiCompressedFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiSmallButton
          fill
          iconType="returnKey"
          iconSide="right"
          onClick={() => toasts.addDanger('To be implemented...')}
        >
          Go
        </EuiSmallButton>
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
        <EuiFlexItem grow={2}>
          <div className="incontextInsightAnchorContent">{target}</div>
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <div className="incontextInsightAnchorIcon">
            <EuiIcon type={chatIcon} size="l" />
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderPopover = () => {
    if (!input || !target || !anchor.current) return;
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

    return (
      <EuiWrappingPopover
        key={input.key}
        button={anchor.current?.firstChild as HTMLElement}
        isOpen={isVisible}
        closePopover={closePopover}
        anchorClassName="incontextInsightAnchor"
        anchorPosition="rightUp"
        offset={6}
        panelPaddingSize="s"
      >
        <EuiPopoverTitle className="incontextInsightPopoverTitle" paddingSize="none">
          <EuiFlexGroup gutterSize="none">
            <EuiFlexItem>
              <div>
                <EuiBadge color="hollow" iconType={chatIcon} iconSide="left">
                  {i18n.translate('assistantDashboards.incontextInsight.assistant', {
                    defaultMessage: 'OpenSearch Assistant',
                  })}
                </EuiBadge>
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div>
                <EuiSmallButtonIcon
                  title={i18n.translate('assistantDashboards.incontextInsight.closeAssistant', {
                    defaultMessage: 'Close assistant popover',
                  })}
                  aria-label={i18n.translate(
                    'assistantDashboards.incontextInsight.closeAssistant',
                    {
                      defaultMessage: 'Close assistant popover',
                    }
                  )}
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
  };

  findIncontextInsight(children);

  return (
    <>
      <>{renderPopover()}</>
      <>{renderAnchor()}</>
    </>
  );
};

// eslint-disable-next-line import/no-default-export
export { IncontextInsight as default };
