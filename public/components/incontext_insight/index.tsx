/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { i18n } from '@osd/i18n';
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
import React, { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { integer } from '@opensearch-project/opensearch/api/types';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getNotifications, IncontextInsightRegistry } from '../../services';
// TODO: Replace with getChrome().logos.Chat.url
import chatIcon from '../../assets/chat.svg';
import { ASSISTANT_API } from '../../../common/constants/llm';
import { HttpSetup } from '../../../../../src/core/public';
import { Interaction } from '../../../common/types/chat_saved_object_attributes';

export interface IncontextInsightProps {
  children?: React.ReactNode;
  contextProvider?: () => Promise<string>;
  httpSetup?: HttpSetup;
  incontextInsightRegistry?: IncontextInsightRegistry;
}

// TODO: add saved objects / config to store seed suggestions
export const IncontextInsight = ({
  children,
  contextProvider,
  httpSetup,
  incontextInsightRegistry,
}: IncontextInsightProps) => {
  const anchor = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLlmResponded, setIsLlmResponded] = useState(false);
  const [summary, setSummary] = useState('');
  const [conversationId, setConversationId] = useState('');

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

  const registry = incontextInsightRegistry;
  const toasts = getNotifications().toasts;
  let target: React.ReactNode;
  let input: IncontextInsightInput;

  const findIncontextInsight = (node: React.ReactNode): React.ReactNode => {
    try {
      if (!isValidElement(node)) return;
      if (node.key && registry?.get(node.key as string)) {
        input = registry.get(node.key as string);
        if (contextProvider) {
          input.contextProvider = contextProvider;
        }
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

  const onChatContinuation = (incontextInsight: IncontextInsightInput) => {
    setIsVisible(false);
    registry?.continueInChat(incontextInsight, conversationId);
    if (anchor.current) {
      const incontextInsightAnchorButtonClassList = anchor.current.parentElement?.querySelector(
        '.incontextInsightAnchorButton'
      )?.classList;
      incontextInsightAnchorButtonClassList?.remove('incontextInsightHoverEffectUnderline');
    }
  };

  const onGenerateSummary = (
    incontextInsight: IncontextInsightInput,
    summarizationQuestion: string
  ) => {
    setIsLoading(true);
    const summarize = async () => {
      const contextContent = incontextInsight.contextProvider
        ? await incontextInsight.contextProvider()
        : '';

      await httpSetup
        ?.post(ASSISTANT_API.SEND_MESSAGE, {
          body: JSON.stringify({
            messages: [],
            input: {
              type: 'input',
              content: summarizationQuestion,
              contentType: 'text',
              context: { content: contextContent, dataSourceId: incontextInsight.datasourceId },
            },
          }),
        })
        .then((response) => {
          response.interactions.map(
            (interaction: Interaction, index: integer, array: Interaction[]) => {
              if (index === array.length - 1) {
                setConversationId(interaction.conversation_id);
              }
            }
          );

          response.messages.map((message: { type: string; content: string }) => {
            if (message.type === 'output') {
              setSummary(message.content);
            }
          });
        })
        .catch((error) => {
          toasts.addDanger(
            i18n.translate('assistantDashboards.incontextInsight.generateSummaryError', {
              defaultMessage: 'Generate summary error',
            })
          );
          setIsLoading(false);
        });

      return;
    };

    return summarize();
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

  const GeneratePopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => {
    if (!isLoading)
      return (
        <EuiButton
          onClick={async () => {
            await onGenerateSummary(
              incontextInsight,
              incontextInsight.suggestions && incontextInsight.suggestions.length > 0
                ? incontextInsight.suggestions[0]
                : 'Please summarize the input'
            );
            setIsLlmResponded(true);
          }}
        >
          {i18n.translate('assistantDashboards.incontextInsight.generateSummary', {
            defaultMessage: 'Generate summary',
          })}
        </EuiButton>
      );
    if (isLoading && !isLlmResponded)
      return (
        <EuiButton isLoading={isLoading}>
          {i18n.translate('assistantDashboards.incontextInsight.generatingSummary', {
            defaultMessage: 'Generating summary...',
          })}
        </EuiButton>
      );
    if (isLoading && isLlmResponded)
      return (
        <>
          <SummaryPopoverBody incontextInsight={incontextInsight} />
          <EuiSpacer size={'xs'} />
          <EuiPanel
            hasShadow={false}
            hasBorder={false}
            element="div"
            onClick={() => {
              onChatContinuation(incontextInsight);
            }}
            grow={false}
            paddingSize="none"
            style={{ width: '120px', float: 'right' }}
          >
            <EuiFlexGroup gutterSize="none" style={{ marginTop: 5 }}>
              <EuiFlexItem grow={false}>
                <EuiIcon type={'chatRight'} style={{ marginRight: 5 }} />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="xs">
                  {i18n.translate('assistantDashboards.incontextInsight.continueInChat', {
                    defaultMessage: 'Continue in chat',
                  })}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </>
      );
  };

  const SummaryPopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => {
    // When there are multiple component objects with different summaries, use summary state as body
    if (summary !== '') {
      return (
        <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="plain">
          <EuiText size="s">{summary}</EuiText>
        </EuiPanel>
      );
    } else {
      return (
        <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="plain">
          <EuiText size="s">{incontextInsight.summary}</EuiText>
        </EuiPanel>
      );
    }
  };

  const SummaryWithSuggestionsPopoverBody: React.FC<{
    incontextInsight: IncontextInsightInput;
  }> = ({ incontextInsight }) => (
    <>
      {<SummaryPopoverBody incontextInsight={incontextInsight} />}
      {<SuggestionsPopoverFooter incontextInsight={incontextInsight} />}
    </>
  );

  const [userQuestion, setUserQuestion] = useState('');
  const ChatPopoverBody: React.FC<{ incontextInsight: IncontextInsightInput }> = ({
    incontextInsight,
  }) => (
    <EuiFlexGroup gutterSize="xs">
      <EuiFlexItem grow={6}>
        <EuiFormRow>
          <EuiFieldText
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
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          fill
          iconType="returnKey"
          iconSide="right"
          onClick={() => {
            onSubmitClick(incontextInsight, userQuestion);
            setUserQuestion('');
          }}
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
      {<ChatPopoverBody incontextInsight={incontextInsight} />}
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
          return <GeneratePopoverBody incontextInsight={input} />;
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
