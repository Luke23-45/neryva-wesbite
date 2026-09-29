import styled from 'styled-components';
import {
  WhatsAppIcon,
  MessengerIcon,
  TelegramIcon,
  WebWidgetIcon,
} from '@assets/brand/providers';

const FallbackMono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

/**
 * Official brand mark per channel platform. Unknown platforms (legacy or
 * future) fall back to the platform slug — never a generic plug.
 */
export function PlatformIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  switch (platform) {
    case 'whatsapp':
      return <WhatsAppIcon size={size} />;
    case 'messenger':
      return <MessengerIcon size={size} />;
    case 'telegram':
      return <TelegramIcon size={size} />;
    case 'web':
      return <WebWidgetIcon size={size} />;
    default:
      return <FallbackMono>{platform}</FallbackMono>;
  }
}
