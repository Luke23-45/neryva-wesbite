import { PageHead } from '@components/common/PageHead';
import { SolutionsHero } from '@/sections/pages/solutions/SolutionsHero';
import { SolutionsCore } from '@/sections/pages/solutions/SolutionsCore';
import { SolutionsApplications } from '@/sections/pages/solutions/SolutionsApplications';
import { SolutionsIndustries } from '@/sections/pages/solutions/SolutionsIndustries';

import heroData from '@neryva_data/solutions/hero.json';

export default function SolutionsPage() {
  return (
    <>
      <PageHead
        title="Neryva Solutions - Practical Enterprise AI"
        description={heroData.description}
        canonicalPath="/solutions"
      />
      
      <main>
        <SolutionsHero />
        <SolutionsCore />
        <SolutionsApplications />
        <SolutionsIndustries />
      </main>
    </>
  );
}
