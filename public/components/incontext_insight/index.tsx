/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { i18n } from '@osd/i18n';
import {
  EuiWrappingPopover,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopoverTitle,
  EuiBadge,
  keys,
  EuiIcon,
  EuiButtonIcon,
} from '@elastic/eui';
import React, { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getIncontextInsightRegistry, getNotifications, getUISettings } from '../../services';
// TODO: Replace with getChrome().logos.Chat.url
import chatIcon from '../../assets/chat.svg';
import {
  ChatPopoverBody,
  ChatWithSuggestionsPopover,
  GenerateSummaryPopoverBody,
  SuggestionsPopoverFooter,
  SummaryPopoverBody,
  SummaryWithSuggestionsPopover,
} from './components';
import { INCONTEXT_INSIGHT_INITIAL_ONLOAD_TIME_SETTING } from '../../../common/constants';

export interface IncontextInsightProps {
  children?: React.ReactNode;
}

// TODO: add saved objects / config to store seed suggestions
export const IncontextInsight = ({ children }: IncontextInsightProps) => {
  const anchor = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const registry = getIncontextInsightRegistry();
  const toasts = getNotifications().toasts;
  const initialOnloadTime = getUISettings().get(INCONTEXT_INSIGHT_INITIAL_ONLOAD_TIME_SETTING);
  let target: React.ReactNode;
  let input: IncontextInsightInput;

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

      const fadeOut = () => {
        let opacityLevel = 100;
        const intervalId = setInterval(() => {
          incontextInsightAnchorIconClassList.remove(`incontextInsightHoverEffect${opacityLevel}`);
          if (opacityLevel === 0) {
            incontextInsightAnchorButtonClassList.remove('incontextInsightHoverEffectUnderline');
            clearInterval(intervalId);
          }
          opacityLevel -= 25;
        }, 45);
      };

      const handleAnyClickEvent = (_: MouseEvent) => {
        fadeOut();
      };

      document.addEventListener('click', handleAnyClickEvent);

      setTimeout(() => {
        fadeOut();
      }, initialOnloadTime);

      return () => {
        document.removeEventListener('click', handleAnyClickEvent);
      };
    }
  }, [initialOnloadTime]);

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
          return (
            <SuggestionsPopoverFooter
              incontextInsight={input}
              suggestions={registry.getSuggestions(input.key)}
              onSubmitClick={onSubmitClick}
            />
          );
        case 'generate':
          return <GenerateSummaryPopoverBody toasts={toasts} />;
        case 'summary':
          return <SummaryPopoverBody incontextInsight={input} />;
        case 'summaryWithSuggestions':
          return (
            <SummaryWithSuggestionsPopover
              incontextInsight={input}
              suggestions={registry.getSuggestions(input.key)}
              onSubmitClick={onSubmitClick}
            />
          );
        case 'chat':
          return <ChatPopoverBody toasts={toasts} />;
        case 'chatWithSuggestions':
          return (
            <ChatWithSuggestionsPopover
              toasts={toasts}
              incontextInsight={input}
              suggestions={registry.getSuggestions(input.key)}
              onSubmitClick={onSubmitClick}
            />
          );
        default:
          return (
            <SummaryWithSuggestionsPopover
              incontextInsight={input}
              suggestions={registry.getSuggestions(input.key)}
              onSubmitClick={onSubmitClick}
            />
          );
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
                <EuiButtonIcon
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
