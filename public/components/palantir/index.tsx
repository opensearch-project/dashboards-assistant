/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import {
  EuiPopover,
  EuiButtonEmpty,
  EuiPopoverTitle,
  EuiText,
  EuiPopoverFooter,
  EuiBadge,
} from '@elastic/eui';
import React, { Children, isValidElement, useState } from 'react';
import { Palantir as PalantirInput } from '../../types';
import { getPalantirRegistry, getChrome } from '../../services';

// TODO: type content
// ?? what is the content going to be? does it change from anchor to anchor
// ?? what is the anchor point? will assume character based
export const Palantir = ({
  children,
  key,
  input,
  onSubmit,
}: {
  children: React.ReactNode;
  key?: string;
  input?: PalantirInput;
  onSubmit?: () => void;
}) => {
  const registry = getPalantirRegistry();
  const logos = getChrome().logos;

  const [isVisible, setIsVisible] = useState(false);

  // TODO: error handling for bad implemention from plugins or just don't render?
  const onAnchorClick = () => setIsVisible((visible) => !visible);
  const onSubmitClick = (palantirInput: PalantirInput) => {
    setIsVisible(false);
    if (onSubmit) {
      onSubmit();
      return;
    }

    // TODO: we have access to the React child. We can crawl it for data and values to pass for more context
    // Example: We can get the text and provide the chat bot more information or think about supporting tokens in the registry
    registry.open(palantirInput);
  };

  const closeAssistantPopover = () => setIsVisible(false);
  const anchorContent = (
    <EuiButtonEmpty
      className="palantirAnchorButton"
      size="xs"
      flush="left"
      iconType={logos.Chat.url}
      iconSide="right"
      onClick={onAnchorClick}
    >
      <span className="palantirAnchorContent">{children}</span>
    </EuiButtonEmpty>
  );

  // TODO: i18n && delay
  // TODO: compressed loading component (empty prompt)
  // TODO: --- loading 2-3 seconds
  const getPalantirInputByChildKey = () => {
    let palantir;
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.key && registry.get(child.key as string)) {
        palantir = registry.get(child.key as string);
      }
    });
    if (!palantir) throw Error('Child key not found in registry.');
    return palantir;
  };

  const palantirInput = input ?? getPalantirInputByChildKey();
  const assistantPopover: React.ReactNode = (
    <EuiPopover
      key={key ?? palantirInput.key}
      button={anchorContent}
      isOpen={isVisible}
      closePopover={closeAssistantPopover}
      anchorClassName="palantirAnchor"
      anchorPosition="upCenter"
      display="block"
    >
      <EuiPopoverTitle className="palantirPopoverTitle" paddingSize="none">
        <EuiBadge color="hollow" iconType={logos.Chat.url} iconSide="left">
          OpenSearch Assistant
        </EuiBadge>
      </EuiPopoverTitle>
      {palantirInput.description ? (
        <EuiText size="s">
          <>{palantirInput.description}</>
        </EuiText>
      ) : null}
      <EuiPopoverFooter>
        <EuiText size="xs">Available suggestions</EuiText>
        <EuiBadge
          color="hollow"
          iconType="chatRight"
          iconSide="left"
          onClick={() => onSubmitClick(palantirInput)}
          onClickAriaLabel="Click for suggestion"
        >
          {palantirInput.suggestion}
        </EuiBadge>
      </EuiPopoverFooter>
    </EuiPopover>
  );

  return <>{assistantPopover}</>;
};

// eslint-disable-next-line import/no-default-export
export { Palantir as default };
