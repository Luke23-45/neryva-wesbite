import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import workspaceData from '@neryva_data/products/agent_studio_chat/workspace.json';

import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatComposer } from './ChatComposer';

import {
  ViewRoot,
  Topbar,
  ChatArea,
  GreetingBlock,
  GreetingTitle,
  GreetingSubtitle,
  Banner,
  BannerLeft,
  BannerIcon,
  BannerText,
  BannerAction,
  BannerClose,
  StageWrapper,
} from './AgentStudioChatView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: premiumEase, delay: custom * 0.08 },
  }),
};

export function AgentStudioChatView() {
  const { setHeaderTheme } = useUiStore();
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    setHeaderTheme('light');
    return () => setHeaderTheme('light');
  }, [setHeaderTheme]);

  const data = workspaceData.workspace;

  return (
    <ViewRoot>
      <Topbar>
        <ChatHeader />
      </Topbar>

      <ChatArea>
        <GreetingBlock as={motion.div} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={1}>
            <GreetingTitle>{data.greeting.title}</GreetingTitle>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <GreetingSubtitle>{data.greeting.subtitle}</GreetingSubtitle>
          </motion.div>
        </GreetingBlock>

        {bannerVisible && (
          <Banner
            as={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: premiumEase, delay: 0.2 }}
          >
            <BannerLeft>
              <BannerIcon viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2.5l2.2 4.6 5.1.6-3.7 3.5 1 5L12 13.7 7.4 16.2l1-5L4.7 7.7l5.1-.6L12 2.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </BannerIcon>
              <BannerText>{data.banner.label}</BannerText>
            </BannerLeft>
            <BannerAction
              as={motion.button}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setBannerVisible(false)}
            >
              {data.banner.action}
            </BannerAction>
            <BannerClose
              aria-label="Dismiss"
              onClick={() => setBannerVisible(false)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </BannerClose>
          </Banner>
        )}

        <StageWrapper>
          <ChatMessages suggestions={data.suggestions} />
        </StageWrapper>

        <ChatComposer
          placeholder={data.composer.placeholder}
          mode={data.composer.mode}
          hint={data.composer.hint}
        />
      </ChatArea>
    </ViewRoot>
  );
}
