import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import coreData from '@neryva_data/solutions/core_offers.json';
import { EnterpriseFeatureIcon } from '@assets/visual/solution/solutioncoreicons';
import {
  CoreWrapper,
  ProductSection,
  SectionHeader,
  SectionFooter,
  SectionTitle,
  SectionDesc,
  CTAButton,
  ButtonLabelText,
  IconContainer,
  BentoGrid,
  GridCell,
  DecorativeCell,
  CornerDot,
  GapAnchor,
  Diamond,
  CardTitle,
  CardDesc,
} from './SolutionsCore.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEase, delay: custom * 0.1 },
  }),
};

/* ────────────────────────────────────────────────────────────────────────
 * Data shape
 *
 * The reference design is three zones sitting on the same row lines:
 *   left column  |  gap  |  middle columns (any count)  |  gap  |  right column
 *
 * Each side column holds exactly ONE content card plus, optionally, one or
 * more decorative filler cells — and always leaves exactly one row on the
 * column truly blank (no cell at all), which is where a floating diamond
 * accent lives.
 * ──────────────────────────────────────────────────────────────────────── */
interface CardContent {
  title: string;
  icon: string;
  description?: string;
  icon_color: string;
  /** 'bottom' pushes title/description down, leaving empty space above
   *  (used by cards with no/short description, e.g. "Frontier models"). */
  align?: 'top' | 'bottom';
}

interface MiddleBlock extends CardContent {
  row: number; // 1-indexed
  col: number; // 1-indexed, relative to the middle zone only
  colSpan?: number; // default 1
}

interface SideColumn {
  contentRow: number;
  /** Row left fully empty. Defaults to the row farthest from contentRow. */
  blankRow?: number;
  content: CardContent;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  href: string;
  link_label: string;
  rows?: number;
  middleColumns?: number;
  middleBlocks: MiddleBlock[];
  leftColumn?: SideColumn;
  rightColumn?: SideColumn;
  /** Which side gets the gap-track diamond vs. the outer-corner diamond.
   *  Defaults to alternating per product so stacked sections stay varied. */
  accents?: { gapSide: 'left' | 'right'; cornerSide: 'left' | 'right' };
}

const products = coreData.products as ProductData[];

/* ── Column line helpers (see styles file for the full track layout) ── */
const LEFT_COL = '1 / 2';
const GAP_LEFT_COL = '2 / 3';
const MID_START = 3;
const midColSpan = (col: number, span: number) =>
  `${MID_START + col - 1} / ${MID_START + col - 1 + span}`;
const gapRightCol = (middleColumns: number) => {
  const end = MID_START + middleColumns;
  return `${end} / ${end + 1}`;
};
const rightCol = (middleColumns: number) => {
  const end = MID_START + middleColumns;
  return `${end + 1} / ${end + 2}`;
};

function rowLine(row: number) {
  return `${row} / ${row + 1}`;
}

/** Resolves which rows in a side column are blank / decorative / content. */
function resolveSideColumn(col: SideColumn, totalRows: number) {
  const blankRow = col.blankRow ?? (col.contentRow === 1 ? totalRows : 1);
  const decorativeRows = Array.from({ length: totalRows }, (_, i) => i + 1).filter(
    (r) => r !== blankRow && r !== col.contentRow
  );
  const filledRows = [...decorativeRows, col.contentRow].sort((a, b) => a - b);
  return { blankRow, decorativeRows, filledRows };
}

const premiumTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1]
};

function CyclicCTAButton({ label }: { label: string }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <CTAButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon 1: Enters from left of the text on hover */}
      <IconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 16 : 0,
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -10,
          marginRight: isHovered ? 8 : 0
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </IconContainer>

      <ButtonLabelText>
        {label}
      </ButtonLabelText>

      {/* Icon 2: Visible at rest on right side, exits right on hover */}
      <IconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 0 : 16,
          opacity: isHovered ? 0 : 1,
          x: isHovered ? 10 : 0,
          marginLeft: isHovered ? 0 : 8
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </IconContainer>
    </CTAButton>
  );
}


export function SolutionsCore() {
  return (
    <CoreWrapper>
      {products.map((product, pIndex) => {
        const middleColumns = product.middleColumns ?? 2;
        const rows =
          product.rows ??
          Math.max(
            ...product.middleBlocks.map((b) => b.row),
            product.leftColumn?.contentRow ?? 1,
            product.rightColumn?.contentRow ?? 1
          );

        const accents =
          product.accents ??
          (pIndex % 2 === 0
            ? { gapSide: 'left' as const, cornerSide: 'right' as const }
            : { gapSide: 'right' as const, cornerSide: 'left' as const });

        const left = product.leftColumn ? resolveSideColumn(product.leftColumn, rows) : null;
        const right = product.rightColumn ? resolveSideColumn(product.rightColumn, rows) : null;

        let blockCustomIndex = 3;

        return (
          <ProductSection key={product.id}>
            {/* Header */}
            <SectionHeader
              as={motion.div}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              <motion.div variants={fadeUp} custom={0}>
                <SectionTitle>{product.title}</SectionTitle>
              </motion.div>
            </SectionHeader>

            {/* Bento grid */}
            <BentoGrid
              as={motion.div}
              $middleColumns={middleColumns}
              $rows={rows}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {/* ── Middle zone blocks ── */}
              {product.middleBlocks.map((block) => (
                <GridCell
                  key={block.title}
                  as={motion.div}
                  variants={fadeUp}
                  custom={blockCustomIndex++}
                  $col={midColSpan(block.col, block.colSpan ?? 1)}
                  $row={rowLine(block.row)}
                >
                  <EnterpriseFeatureIcon id={block.icon} iconColor={block.icon_color} />
                  <CardTitle $pushToBottom={block.align === 'bottom'}>{block.title}</CardTitle>
                  {block.description && <CardDesc>{block.description}</CardDesc>}
                </GridCell>
              ))}

              {/* ── Left column zone ── */}
              {left && product.leftColumn && (
                <>
                  {left.decorativeRows.map((row) => (
                    <DecorativeCell key={`left-decor-${row}`} $col={LEFT_COL} $row={rowLine(row)}>
                      {/* Every filled cell marks its own top edge; only the last
                          (bottommost) filled cell also marks the bottom edge.
                          Together these dot every row-line in the stack exactly once. */}
                      <CornerDot $corner="tl" />
                      <CornerDot $corner="tr" />
                      {row === left.filledRows[left.filledRows.length - 1] && (
                        <>
                          <CornerDot $corner="bl" />
                          <CornerDot $corner="br" />
                        </>
                      )}
                      {accents.cornerSide === 'left' &&
                        row === left.filledRows[left.filledRows.length - 1] && (
                          <Diamond $placement="corner" />
                        )}
                    </DecorativeCell>
                  ))}
                  <GridCell
                    as={motion.div}
                    variants={fadeUp}
                    custom={blockCustomIndex++}
                    $col={LEFT_COL}
                    $row={rowLine(product.leftColumn.contentRow)}
                  >
                    <CornerDot $corner="tl" />
                    <CornerDot $corner="tr" />
                    {product.leftColumn.contentRow ===
                      left.filledRows[left.filledRows.length - 1] && (
                        <>
                          <CornerDot $corner="bl" />
                          <CornerDot $corner="br" />
                        </>
                      )}
                    <EnterpriseFeatureIcon id={product.leftColumn.content.icon} iconColor={product.leftColumn.content.icon_color} />
                    <CardTitle $pushToBottom={product.leftColumn.content.align !== 'top'}>
                      {product.leftColumn.content.title}
                    </CardTitle>
                    {product.leftColumn.content.description && (
                      <CardDesc>{product.leftColumn.content.description}</CardDesc>
                    )}
                    {accents.cornerSide === 'left' &&
                      product.leftColumn.contentRow ===
                      left.filledRows[left.filledRows.length - 1] && (
                        <Diamond $placement="corner" />
                      )}
                  </GridCell>

                  {accents.gapSide === 'left' && (
                    <GapAnchor $col={GAP_LEFT_COL} $row={rowLine(left.blankRow)}>
                      <Diamond
                        $placement={left.blankRow < left.filledRows[0] ? 'gap-bottom' : 'gap-top'}
                      />
                    </GapAnchor>
                  )}
                </>
              )}

              {/* ── Right column zone ── */}
              {right && product.rightColumn && (
                <>
                  {right.decorativeRows.map((row) => (
                    <DecorativeCell
                      key={`right-decor-${row}`}
                      $col={rightCol(middleColumns)}
                      $row={rowLine(row)}
                    >
                      <CornerDot $corner="tl" />
                      <CornerDot $corner="tr" />
                      {row === right.filledRows[right.filledRows.length - 1] && (
                        <>
                          <CornerDot $corner="bl" />
                          <CornerDot $corner="br" />
                        </>
                      )}
                      {accents.cornerSide === 'right' &&
                        row === right.filledRows[right.filledRows.length - 1] && (
                          <Diamond $placement="corner" />
                        )}
                    </DecorativeCell>
                  ))}
                  <GridCell
                    as={motion.div}
                    variants={fadeUp}
                    custom={blockCustomIndex++}
                    $col={rightCol(middleColumns)}
                    $row={rowLine(product.rightColumn.contentRow)}
                  >
                    <CornerDot $corner="tl" />
                    <CornerDot $corner="tr" />
                    {product.rightColumn.contentRow ===
                      right.filledRows[right.filledRows.length - 1] && (
                        <>
                          <CornerDot $corner="bl" />
                          <CornerDot $corner="br" />
                        </>
                      )}
                    <EnterpriseFeatureIcon id={product.rightColumn.content.icon} iconColor={product.rightColumn.content.icon_color} />
                    <CardTitle $pushToBottom={product.rightColumn.content.align !== 'top'}>
                      {product.rightColumn.content.title}
                    </CardTitle>
                    {product.rightColumn.content.description && (
                      <CardDesc>{product.rightColumn.content.description}</CardDesc>
                    )}
                  </GridCell>

                  {accents.gapSide === 'right' && (
                    <GapAnchor $col={gapRightCol(middleColumns)} $row={rowLine(right.blankRow)}>
                      <Diamond
                        $placement={
                          right.blankRow < right.filledRows[0] ? 'gap-bottom' : 'gap-top'
                        }
                      />
                    </GapAnchor>
                  )}
                </>
              )}
            </BentoGrid>

            {/* Footer / CTA */}
            <SectionFooter
              as={motion.div}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              <motion.div variants={fadeUp} custom={0}>
                <Link to={product.href} style={{ textDecoration: 'none' }}>
                  <CyclicCTAButton label={product.link_label} />
                </Link>
              </motion.div>
            </SectionFooter>
          </ProductSection>
        );
      })}
    </CoreWrapper>
  );
}