import { PageHead } from '@components/common/PageHead';
import { RoboticsHero } from '@/sections/pages/solutions/robotics/RoboticsHero';
import { RoboticsStandards } from '@/sections/pages/solutions/robotics/RoboticsStandards';
import { RoboticsWorkflows } from '@/sections/pages/solutions/robotics/RoboticsWorkflows';
import { RoboticsResearch } from '@/sections/pages/solutions/robotics/RoboticsResearch';

export default function RoboticsPage() {
  return (
    <>
      <PageHead
        title="Applied Robotics AI"
        description="Intelligence at the edge of physical execution. Optimized AI systems for robotics fleets, autonomous vehicles, and industrial automation."
        canonicalPath="/solutions/robotics"
      />
      <RoboticsHero />
      <RoboticsStandards />
      <RoboticsWorkflows />
      <RoboticsResearch />
    </>
  );
}
