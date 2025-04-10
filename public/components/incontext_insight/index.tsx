/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSmallButton,
  EuiSmallButtonIcon,
  EuiSpacer,
  EuiText,
  EuiWrappingPopover,
  keys,
  EuiBetaBadge,
  EuiButtonEmpty,
} from '@elastic/eui';
import React, { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getIncontextInsightRegistry, getNotifications, getLogoIcon } from '../../services';
import sparkle from '../../assets/sparkle.svg';
import shinySparkle from '../../assets/sparkle_with_gradient.svg';
import { HttpSetup, StartServicesAccessor } from '../../../../../src/core/public';
import { GeneratePopoverBody } from './generate_popover_body';
import { UsageCollectionSetup } from '../../../../../src/plugins/usage_collection/public/plugin';
import { AssistantPluginStartDependencies } from '../../types';

export interface IncontextInsightProps {
  children?: React.ReactNode;
  httpSetup?: HttpSetup;
  usageCollection?: UsageCollectionSetup;
  getStartServices?: StartServicesAccessor<AssistantPluginStartDependencies>;
  title: string;
}

// TODO: add saved objects / config to store seed suggestions
export const IncontextInsight = ({
  children,
  httpSetup,
  usageCollection,
  getStartServices,
  title,
}: IncontextInsightProps) => {
  const anchor = useRef<HTMLDivElement>(null);
  const anchorButton = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const registry = getIncontextInsightRegistry();
  const toasts = getNotifications().toasts;
  let target: React.ReactNode;
  let input: IncontextInsightInput;

  const findIncontextInsight = (node: React.ReactNode): React.ReactNode => {
    try {
      if (!isValidElement(node)) return;
      if (node.key && registry?.get(node.key as string)) {
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
    registry?.open(incontextInsight, suggestion);
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
        {registry?.getSuggestions(incontextInsight.key).map((suggestion, index) => (
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

  const ChatPopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => {
    const [userQuestion, setUserQuestion] = useState('');

    return (
      <EuiFlexGroup gutterSize="xs">
        <EuiFlexItem grow={6}>
          <EuiCompressedFormRow>
            <EuiCompressedFieldText
              placeholder="Ask a question"
              value={userQuestion}
              autoFocus
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSubmitClick(incontextInsight, userQuestion);
                  setUserQuestion('');
                }
              }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            fill
            iconType="returnKey"
            iconSide="right"
            onClick={() => {
              onSubmitClick(incontextInsight, userQuestion);
              setUserQuestion('');
            }}
          >
            Go
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const ChatWithSuggestionsPopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => (
    <>
      {<ChatPopoverBody incontextInsight={incontextInsight} />}
      {<SuggestionsPopoverFooter incontextInsight={incontextInsight} />}
    </>
  );

  const renderAnchor = () => {
    if (!input || !target) return children;

    const sparkleIcon = isHover ? shinySparkle : sparkle;
    return (
      <EuiFlexGroup
        className="incontextInsightAnchorButton"
        onKeyDown={onAnchorKeyPress}
        gutterSize="none"
        alignItems="center"
        ref={anchor}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <EuiFlexItem grow={2}>
          <div className="incontextInsightAnchorContent">{target}</div>
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <div
            className="incontextInsightAnchorIcon"
            onClick={onAnchorClick}
            onKeyDown={(e) => {
              if (e.key === keys.ENTER || e.key === keys.SPACE) {
                onAnchorClick();
              }
            }}
            tabIndex={0}
            role="button"
            ref={anchorButton}
          >
            <EuiBetaBadge
              label={title}
              style={{ backgroundColor: euiThemeVars.euiColorInk }}
              className="summary-beta-badge"
              iconType={getLogoIcon('white')}
            />
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderPopover = () => {
    if (!input || !target || !anchor.current || !anchorButton.current) return;
    const popoverBody = () => {
      switch (input.type) {
        case 'suggestions':
          return <SuggestionsPopoverFooter incontextInsight={input} />;
        case 'generate':
          return (
            <GeneratePopoverBody
              incontextInsight={input}
              httpSetup={httpSetup}
              usageCollection={usageCollection}
              closePopover={closePopover}
              getStartServices={getStartServices}
            />
          );
        case 'summary':
          return <SummaryPopoverBody incontextInsight={input} />;
        case 'summaryWithSuggestions':
          return <SummaryWithSuggestionsPopoverBody incontextInsight={input} />;
        case 'chat':
          return <ChatPopoverBody incontextInsight={input} />;
        case 'chatWithSuggestions':
          return <ChatWithSuggestionsPopoverBody incontextInsight={input} />;
        default:
          return <SummaryWithSuggestionsPopoverBody incontextInsight={input} />;
      }
    };

    return (
      <EuiWrappingPopover
        key={input.key}
        button={anchorButton.current}
        isOpen={isVisible}
        closePopover={closePopover}
        anchorClassName="incontextInsightAnchor"
        anchorPosition="rightUp"
        offset={6}
        panelPaddingSize="s"
        panelClassName="incontextInsightPopover"
      >
        {
          // For 'generate' type insights, we don't want to show this title but its own inner title
          input.type !== 'generate' && (
            <EuiPopoverTitle className="incontextInsightPopoverTitle" paddingSize="none">
              <EuiFlexGroup gutterSize="none">
                <EuiFlexItem>
                  <div>
                    <EuiBadge color="hollow" iconType={getLogoIcon('gradient')} iconSide="left">
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
          )
        }
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
