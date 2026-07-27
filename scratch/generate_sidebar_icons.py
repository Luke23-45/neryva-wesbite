import os

def optimize_pixels(art_str, color_map):
    lines = [line for line in art_str.strip().split('\n') if line]
    if not lines: return []
    
    pixels = []
    height = len(lines)
    width = len(lines[0])
    
    for y in range(height):
        x = 0
        while x < width:
            char = lines[y][x]
            if char != '.' and char != ' ':
                start_x = x
                while x < width and lines[y][x] == char:
                    x += 1
                w = x - start_x
                color = color_map.get(char, char)
                pixels.append((start_x, y, w, 1, color))
            else:
                x += 1
                
    optimized = []
    used = set()
    for i, p1 in enumerate(pixels):
        if i in used: continue
        x1, y1, w1, h1, c1 = p1
        curr_h = h1
        
        for j in range(i + 1, len(pixels)):
            if j in used: continue
            x2, y2, w2, h2, c2 = pixels[j]
            if x1 == x2 and w1 == w2 and c1 == c2 and y2 == y1 + curr_h:
                curr_h += h2
                used.add(j)
        
        optimized.append((x1, y1, w1, curr_h, c1))
        
    return optimized

def print_pixels(pixels):
    out = "    <PixelBlocks\n      pixels={[\n"
    for p in pixels:
        x, y, w, h, c = p
        if w == 1 and h == 1:
            out += f"        [{x}, {y}, '{c}'],\n"
        else:
            out += f"        [{x}, {y}, {w}, {h}, '{c}'],\n"
    out += "      ]}\n    />\n"
    return out

ICONS = {}

# 1. SidebarLLMIcon (Language Systems - Blue Accent)
ICONS['SidebarLLMIcon'] = {
    'map': {
        'D': '#173F9E', # Dark Blue Outline
        'B': '#2458D3', # Blue (Accent)
        'L': '#93C5FD', # Light Blue highlight
        'O': '#F97316', # Orange
        'M': '#FBBF24', # Yellow
        'W': '#FFFFFF', # White text/lines
        'G': '#475569', # Gray
    },
    'art': """
........OOOO........
.......OOMMOO.......
......OOMMMMOO......
.....OOMWWWWMMO.....
....OOMWWWWWWMMO....
...OOMWWWWWWWWMMO...
..OOMMWWNNNNWWMMOO..
..OOMMWNNNNNNWMMOO..
..OOMMWNNWWNNWMMOO..
..OOMMWNNWWNNWMMOO..
..OOMMWNNNNNNWMMOO..
..OOMMWWNNNNWWMMOO..
...OOMWWWWWWWWMMO...
....OOMWWWWWWMMO....
.....OOMWWWWMMO.....
......OOMMMMOO......
.......OOMMOO.......
........OOOO........
....................
....................
"""
}

# 2. SidebarRoboticsIcon (Robotics - Teal Accent)
ICONS['SidebarRoboticsIcon'] = {
    'map': {
        'W': '#FFFFFF', # White
        'G': '#A1E3DF', # Light Teal Base
        'B': '#0B7F79', # Teal (Accent)
        'O': '#F97316', # Orange joint
        'D': '#065752', # Dark Teal outline
        'L': '#E2E8F0', # Light gray highlight
        'S': '#94A3B8', # Shadow
    },
    'art': """
......DDDDDD........
.....DGGGGGGD.......
....DGGGGGGGGD......
....DGGGLLGGGD......
....DGGL..LGGD......
....DGGL..LGGD......
....DGGL..LGGD......
....DGGL..LGGD......
.....DGG..GGD.......
......DG..GD........
.....OOOOOOOO.......
....OOWWWWUWOO......
....OOOWWWOOOO......
......DBBBD.........
......DBBBD.........
......DBBBD.........
......DBBBD.........
.....DSSSSSD........
....DSGGGGGSD.......
...DDDDDDDDDDD......
"""
}

# 3. SidebarClinicalIcon (Biomedical/Clinical AI - Green Accent)
ICONS['SidebarClinicalIcon'] = {
    'map': {
        'P': '#1F7A4D', # Green (Accent)
        'R': '#134D30', # Dark Green Outline
        'O': '#F97316', # Orange label
        'Y': '#FBBF24', # Yellow liquid
        'W': '#FFFFFF', # White highlight
        'B': '#A7F3D0', # Light Green smoke
        'L': '#6EE7B7', # Green smoke
        'G': '#D1D5DB', # Glass color
    },
    'art': """
........RRRR........
.......RGWWRR.......
......RGGWWRGR......
.......RGGWR........
........RRRR........
.........GG.........
.........GG.........
........RGRR........
........RYYR........
.......RYYYYR.......
.......RYYYYR.......
......RYYOOYYR......
......RYYOOYYR......
.....RYYOPPOYYR.....
.....RYYPPPOYYR.....
....RYYPPPPPOYYR....
....RYYPRRRPPOYR....
...RYYYPRRRRPOYYR...
...RRRRRRRRRRRRRR...
....................
"""
}

# 4. SidebarEnergyIcon (Energy Systems - Orange Accent)
ICONS['SidebarEnergyIcon'] = {
    'map': {
        'O': '#D99100', # Orange (Accent)
        'Y': '#FBBF24', # Yellow bright
        'M': '#B37700', # Dark Orange Outline
        'W': '#FFFFFF', # White highlight
        'D': '#1E3A8A', # Dark blue base
        'B': '#3B82F6', # Blue base
        'G': '#475569', # Grey base
        'N': '#F97316', # Inner N color
    },
    'art': """
........MMMM........
......MMYYYYMM......
.....MYYYYYYYYM.....
....MYYYWWWYYYYM....
....MYYYWWWYYYYM....
...MYYWWNWWNYYYYM...
...MYYWNNWNNWYYYM...
...MYYWNWNWNWYYYM...
...MYYWWNWWNYYYYM...
....MYYYWWWWYYYM....
....MYYYOOOOYYYM....
.....MYYOOOOYYM.....
......MMOOOOMM......
.......MGGGGM.......
.......GDDDDG.......
.......GDWWDG.......
.......GDBBDG.......
........GDDG........
........GGGG........
.........GG.........
"""
}

# 5. SidebarComputationalIcon (Computational Science - Purple Accent)
ICONS['SidebarComputationalIcon'] = {
    'map': {
        'W': '#F8FAFC', # White border
        'C': '#E2E8F0', # Light chalk color
        'B': '#A855F7', # Purple board base
        'P': '#8E44AD', # Purple (Accent)
        'D': '#5B2C6F', # Dark Purple frame / shadow
        'O': '#D99100', # Orange eraser
        'Y': '#FCD34D', # Yellow chalk detail
        'M': '#E9D5FF', # Very light purple
    },
    'art': """
..DDDDDDDDDDDDDDDD..
..DWWWWWWWWWWWWWWD..
..DMBBBBBBBBBBBBWD..
..DMBBBBBBBBBBBBWD..
..DMBCCCBBBBBBBBWD..
..DMBCBBBBBCBCCBWD..
..DMBCBBBBBCBCBBWD..
..DMBCBBBBBCBCCBWD..
..DMBCCCCBBCBCCBWD..
..DMBCBBCCBCBCBBWD..
..DMBCBBCCBCBCCBWD..
..DMBBBBBBBBBBBBWD..
..DMBBBBBBBBBBBBWD..
..DMBBBBBBYYBBBBWD..
..DWWWWWWWWWWWWWWD..
..DDDDDDDDDDDDDDDD..
..........OO........
..........OO........
....................
....................
"""
}

TSX_HEADER = '''import React, { type SVGProps } from 'react';

type Pixel = [number, number, string] | [number, number, number, number, string];

function PixelBlocks({
  pixels,
  ...svgProps
}: SVGProps<SVGSVGElement> & { pixels: Pixel[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...svgProps}
    >
      {pixels.map((pixel, index) => {
        const [x, y, wOrColor, hOrColor, maybeColor] = pixel;
        const w = typeof wOrColor === 'number' ? wOrColor : 1;
        const h = typeof hOrColor === 'number' ? hOrColor : 1;
        const fill = typeof wOrColor === 'number' ? (maybeColor as string) : (wOrColor as string);
        return <rect key={`${x}-${y}-${index}`} x={x} y={y} width={w} height={h} fill={fill} />;
      })}
    </svg>
  );
}

'''

def generate_all():
    file_path = "C:/Users/Hellx/Documents/Programming/python/Project/Neryva/neryva-website/src/sections/pages/home/HomePrograms/HomeProgramIcons.tsx"
    with open(file_path, "w") as f:
        f.write(TSX_HEADER)
        for name, data in ICONS.items():
            f.write(f"export function {name}() {{\n  return (\n")
            pixels = optimize_pixels(data['art'], data['map'])
            f.write(print_pixels(pixels))
            f.write("  );\n}\n\n")
    print(f"Icons generated in {file_path}")

if __name__ == '__main__':
    generate_all()
