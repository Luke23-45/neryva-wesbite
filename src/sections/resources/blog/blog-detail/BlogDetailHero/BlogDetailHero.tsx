import { motion } from 'framer-motion';
import type { BlogPost } from '@types';
import { PostMosaic } from '@/assets/visual/blog/PostMosaic';
import {
  HeroWrapper,
  HeroMosaic,
  HeroMosaicOverlay,
  HeroCategoryBadge,
  HeroMeta,
  HeroMetaCell,
  HeroMetaLabel,
  HeroTitleSection,
  HeroCategory,
  HeroTitle,
  HeroSummary,
} from './BlogDetailHero.styles';

interface Props {
  post: BlogPost;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: d },
  }),
};

export function BlogDetailHero({ post }: Props) {
  return (
    <HeroWrapper>
      {/* ── Full-width mosaic ── */}
      <HeroMosaic>
        <PostMosaic seed={post.seed} baseColor={post.colorTheme} />
        <HeroMosaicOverlay />
        <HeroCategoryBadge>{post.category}</HeroCategoryBadge>
      </HeroMosaic>

      {/* ── Meta strip (date / author / reading time) ── */}
      <HeroMeta>
        <HeroMetaCell>
          <HeroMetaLabel>Date</HeroMetaLabel>
          {formatDate(post.date)}
        </HeroMetaCell>
        <HeroMetaCell>
          <HeroMetaLabel>Author</HeroMetaLabel>
          {post.author}
        </HeroMetaCell>
        <HeroMetaCell>
          <HeroMetaLabel>Read</HeroMetaLabel>
          {post.readingTime} min
        </HeroMetaCell>
      </HeroMeta>

      {/* ── Title + summary ── */}
      <HeroTitleSection>
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={fadeUp}
        >
          <HeroCategory>{post.category}</HeroCategory>
          <HeroTitle>{post.title}</HeroTitle>
          <HeroSummary>{post.summary}</HeroSummary>
        </motion.div>
      </HeroTitleSection>
    </HeroWrapper>
  );
}
