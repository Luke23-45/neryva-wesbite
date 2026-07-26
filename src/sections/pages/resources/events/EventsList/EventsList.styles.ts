import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 160px 0;
  background-color: #fafaf9; /* Supremely warm eggshell to make pure white cards stand out natively */

  ${({ theme }) => theme.media.tablet} {
    padding: 100px 0;
  }
`;

export const InnerGrid = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

/* ─── THE PRECISION COMMAND FILTERS ─── */
export const FiltersContainer = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 40px;
  margin-bottom: 64px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 32px;
`;

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const FilterLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #111;
  text-transform: uppercase;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

export const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px; /* Razor tight spatial correlation mirroring your image */
`;

/* The Slanted Blueprint Buttons */
export const SlantedTab = styled.button<{ $active: boolean }>`
  position: relative;
  /* Precisely slanted geometry matches screenshot constraints perfectly */
  transform: skewX(-14deg);
  background: ${({ $active }) => ($active ? '#3563E9' : '#ffffff')}; /* Bright signature Mistral Blue */
  border: 1px solid ${({ $active, theme }) => ($active ? '#3563E9' : theme.colors.border)};
  padding: 10px 20px;
  border-radius: 4px; /* Tiny smooth bend on slanted limits natively avoiding hard artifacts */
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? '#2b50bd' : '#f5f5f5')};
  }

  /* Anti-skew correction keeps font structurally vertical inside slanted parent */
  span {
    display: inline-block;
    transform: skewX(14deg);
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: ${({ $active }) => ($active ? '#ffffff' : '#333333')};
    text-transform: uppercase;
  }
`;

/* Pristine UI Dropdown Menu */
export const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  min-width: 180px;
`;

export const DropdownHeader = styled.div<{ $isOpen: boolean, $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 40px; /* Aligns mathematically equal bounding boxes with slants next to it */
  background: ${({ $isActive }) => ($isActive ? '#3563E9' : '#ffffff')};
  border: 1px solid ${({ $isActive, theme }) => ($isActive ? '#3563E9' : theme.colors.border)};
  border-radius: 4px;
  padding: 0 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: skewX(-14deg);

  &:hover {
    background: ${({ $isActive }) => ($isActive ? '#2b50bd' : '#f5f5f5')};
  }

  span {
    display: inline-block;
    transform: skewX(14deg);
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    font-size: 13px;
    font-weight: 500;
    color: ${({ $isActive }) => ($isActive ? '#ffffff' : '#4A4A4A')};
    text-transform: uppercase;
  }
  
  svg {
    transform: skewX(14deg);
  }
`;

export const DropdownList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  z-index: 100;
  overflow: hidden;
`;

export const DropdownItem = styled.div<{ $selected: boolean }>`
  padding: 12px 16px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: ${({ $selected }) => ($selected ? '#3563E9' : '#4A4A4A')};
  text-transform: uppercase;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? '#f8faff' : 'transparent')};
  transition: background-color 0.15s ease;

  &:hover {
    background: #f5f5f5;
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;


/* ─── THE CINEMATIC EVENT CARDS MATRIX ─── */
export const CardMatrix = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }
  
  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* Total Unyielding Visual Encapsulation Container */
export const EventCard = styled.a`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
`;

export const VisualHeader = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #E2E8F0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  ${EventCard}:hover & img {
    transform: scale(1.05);
  }
`;

/* Ultra Premium OS-style Floating Inner Category Pill */
export const FloatTag = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px 10px;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #111;
  text-transform: uppercase;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

/* Internal Pacing Layout Bounds */
export const BodyPayload = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  flex: 1; /* Magnets buttons safely onto exact array flush flooring grids simultaneously! */
`;

export const MetaLine = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 12px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;

export const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.015em;
  color: #0F172A;
  margin: 0 0 32px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
  }
`;

/* Conditional state mechanical anchor */
export const InteractionButton = styled.div<{ $status: 'upcoming' | 'past' }>`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  padding: 12px 24px;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 600;
  
  /* State Machine Render Aesthetics */
  background: ${({ $status }) => ($status === 'upcoming' ? '#0F172A' : 'transparent')};
  color: ${({ $status }) => ($status === 'upcoming' ? '#ffffff' : '#0F172A')};
  border: 1px solid ${({ $status }) => ($status === 'upcoming' ? 'transparent' : '#cbd5e1')};
  
  transition: opacity 0.2s ease;
  
  /* Inner SVG strict padding overrides */
  svg {
    width: 16px;
    height: 16px;
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;