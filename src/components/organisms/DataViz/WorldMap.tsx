import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MapRegion {
    id: string;
    name: string;
    coordinates: { x: number; y: number }; // Percentage 0-100
    livesImpacted: number;
}

interface WorldMapProps {
    regions: MapRegion[];
}

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

// Simplified SVG Map Background (Abstract representation)
const MapBackground = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image: radial-gradient(${({ theme }) => theme.colors.text.muted} 1px, transparent 1px);
  background-size: 20px 20px;
`;

const Marker = styled(motion.button) <{ x: number; y: number }>`
  position: absolute;
  left: ${({ x }) => x}%;
  top: ${({ y }) => y}%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent.teal};
  border: 2px solid ${({ theme }) => theme.colors.background.primary};
  cursor: pointer;
  transform: translate(-50%, -50%);
  z-index: 2;
  padding: 0;

  &:hover {
    z-index: 10;
  }
  
  /* Pulse animation */
  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.colors.accent.teal};
    opacity: 0.6;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.5); opacity: 0; }
  }
`;

const Tooltip = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  white-space: nowrap;
  pointer-events: none;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 20;

  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[1]};
  }

  p {
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

export const WorldMap = ({ regions }: WorldMapProps) => {
    const [activeRegion, setActiveRegion] = useState<string | null>(null);

    return (
        <MapContainer>
            <MapBackground />
            {regions.map((region) => (
                <Marker
                    key={region.id}
                    x={region.coordinates.x}
                    y={region.coordinates.y}
                    onMouseEnter={() => setActiveRegion(region.id)}
                    onMouseLeave={() => setActiveRegion(null)}
                    onFocus={() => setActiveRegion(region.id)}
                    onBlur={() => setActiveRegion(null)}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    aria-label={`Region: ${region.name}, Lives Impacted: ${region.livesImpacted.toLocaleString()}`}
                >
                    {activeRegion === region.id && (
                        <Tooltip
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h4>{region.name}</h4>
                            <p>{region.livesImpacted.toLocaleString()} Lives Impacted</p>
                        </Tooltip>
                    )}
                </Marker>
            ))}
        </MapContainer>
    );
};
