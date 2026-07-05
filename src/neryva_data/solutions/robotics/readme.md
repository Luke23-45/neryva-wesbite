To design the `/solutions/robotics` page, we must speak the language of hardware engineers, automation directors, and fleet operators. 

In enterprise robotics (manufacturing arms, autonomous mobile robots (AMRs), drones, and logistics automation), the bottleneck is rarely the hardware itself. The bottlenecks are **edge compute constraints, debugging massive telemetry/ROS logs when things break in the field, and translating human intent into kinematic execution.**

Neryva’s strategic positioning here is twofold: 
1. **Embedded/Firmware AI:** Deploying highly optimized, lightweight reasoning models directly onto the robot's hardware (e.g., NVIDIA Jetson, custom ARM SoCs).
2. **Diagnostic AI Assistants:** Helping engineers instantly parse massive telemetry data and ROS (Robot Operating System) logs to fix field failures.

Here is the exact, zero-slop architecture for the Applied Robotics domain page. 

### The Page Blueprint (Markdown Layout)

```text
=======================================================================================================
[ HEADER NAV ]  Products ▾   Solutions ▾   Research   Resources ▾   Company ▾       [ Talk to Sales ]
=======================================================================================================

  [ APPLIED ROBOTICS AI ]

  Intelligence at the edge of physical execution.

  We engineer and deploy highly optimized AI systems for robotics fleets, 
  autonomous vehicles, and industrial automation. From custom embedded firmware 
  to ROS diagnostic assistants, we bridge the gap between reasoning and action.

  [ Speak with Solutions  → ]

-------------------------------------------------------------------------------------------------------
  [ DIAGRAM: A stark system architecture showing a Neryva edge model integrated into a robot's 
             custom firmware, interfacing directly with vision sensors and RTOS execution layers. ]
=======================================================================================================

  THE NERYVA ROBOTICS STANDARD
  Engineered for low-latency, deterministic physical environments.
  -----------------------------------------------------------------------------------------------------
  
  [ Hardware-Agnostic Edge AI ]    [ Sensor Fusion & Vision ]       [ Firmware-Level Security ]
  Robots cannot rely on cloud      True autonomy requires context.  Our embedded models operate 
  latency. We compress and deploy  Neryva natively processes        within strict RTOS bounds, 
  our models directly to your      multi-modal inputs—combining     ensuring that AI reasoning 
  local compute—optimizing for     vision, LiDAR, and kinematic     never overrides hardcoded 
  NVIDIA Jetson, ARM, or custom    telemetry for dynamic spatial    safety stops or mechanical 
  silicon architectures.           reasoning at the edge.           fail-safes.

=======================================================================================================

  APPLIED ROBOTIC WORKFLOWS
  Accelerating development, deployment, and field operations.
  -----------------------------------------------------------------------------------------------------

  [ 01. ROS Diagnostics & Telemetry Assistant ]
  When a robot fails in the field, debugging takes hours. The Neryva Assistant securely 
  ingests massive ROS (Robot Operating System) bag files, error logs, and sensor telemetry. 
  Engineers can query the data to instantly isolate the exact point of hardware failure.

  [ 02. Human-to-Machine Task Transfer ]
  Bridge the gap between operator intent and robotic action. We integrate language models 
  into your control stack, allowing operators to issue complex, natural-language commands 
  that the system deterministically translates into verifiable kinematic trajectories.

  [ 03. Custom Firmware & Embedded Autonomy ]
  Go beyond out-of-the-box APIs. Neryva engineers collaborate with your hardware teams 
  to build custom, AI-augmented firmware. We optimize local inference to enable real-time 
  object recognition, dynamic path planning, and autonomous edge decision-making.

=======================================================================================================

  ROBOTICS & TASK TRANSFER RESEARCH
  Backed by rigorous, multi-domain AI research.
  -----------------------------------------------------------------------------------------------------
  Our embedded solutions are the direct result of Neryva’s foundational lab research 
  into spatial reasoning, model quantization, and cross-domain task transfer.

  [ RESEARCH ARTIFACT ]
  Evaluating Zero-Shot Task Transfer: Translating Natural Language into Kinematic Constraints.
  [ Read the Note ↗ ]

=======================================================================================================
  
  Deploy intelligence at the edge.

  [ Talk to Solutions  → ]

=======================================================================================================
```

***

### The JSON Data Blocks

Here is the highly precise, hardware-grade JSON data. The vocabulary (RTOS, ROS bag files, kinematic trajectories, NVIDIA Jetson, sensor fusion) instantly signals to a Director of Robotics that Neryva actually understands the physical layer, not just the software layer.

#### `robotics_section1_hero.json`
```json
{
  "id": "robotics-hero",
  "eyebrow": "APPLIED ROBOTICS AI",
  "title": "Intelligence at the edge of physical execution.",
  "description": "We engineer and deploy highly optimized AI systems for robotics fleets, autonomous vehicles, and industrial automation. From custom embedded firmware to ROS diagnostic assistants, we bridge the gap between reasoning and action.",
  "visual": {
    "type": "embedded_architecture_diagram",
    "alt": "System architecture diagram showing Neryva edge models interfacing with vision sensors and RTOS execution layers."
  },
  "cta": {
    "label": "Speak with Solutions",
    "href": "/contact",
    "primary": true
  }
}
```

#### `robotics_section2_standards.json`
```json
{
  "id": "robotics-standards",
  "title": "THE NERYVA ROBOTICS STANDARD",
  "subtitle": "Engineered for low-latency, deterministic physical environments.",
  "features": [
    {
      "title": "Hardware-Agnostic Edge AI",
      "description": "Robots cannot rely on cloud latency. We compress and deploy our models directly to your local compute—optimizing for NVIDIA Jetson, ARM, or custom silicon architectures."
    },
    {
      "title": "Sensor Fusion & Vision",
      "description": "True autonomy requires context. Neryva natively processes multi-modal inputs—combining vision, LiDAR, and kinematic telemetry for dynamic spatial reasoning at the edge."
    },
    {
      "title": "Firmware-Level Security",
      "description": "Our embedded models operate within strict RTOS (Real-Time Operating System) bounds, ensuring that AI reasoning never overrides hardcoded safety stops or mechanical fail-safes."
    }
  ]
}
```

#### `robotics_section3_workflows.json`
```json
{
  "id": "robotics-workflows",
  "title": "APPLIED ROBOTIC WORKFLOWS",
  "subtitle": "Accelerating development, deployment, and field operations.",
  "workflows": [
    {
      "step": "01",
      "title": "ROS Diagnostics & Telemetry Assistant",
      "description": "When a robot fails in the field, debugging takes hours. The Neryva Assistant securely ingests massive ROS bag files, error logs, and sensor telemetry. Engineers can query the data to instantly isolate the exact point of hardware or software failure."
    },
    {
      "step": "02",
      "title": "Human-to-Machine Task Transfer",
      "description": "Bridge the gap between operator intent and robotic action. We integrate language models into your control stack, allowing operators to issue complex commands that the system deterministically translates into verifiable kinematic trajectories."
    },
    {
      "step": "03",
      "title": "Custom Firmware & Embedded Autonomy",
      "description": "Go beyond out-of-the-box APIs. Neryva engineers collaborate with your hardware teams to build custom, AI-augmented firmware. We optimize local inference to enable real-time object recognition and autonomous edge decision-making."
    }
  ]
}
```

#### `robotics_section4_research.json`
```json
{
  "id": "robotics-research",
  "title": "ROBOTICS & TASK TRANSFER RESEARCH",
  "subtitle": "Backed by rigorous, multi-domain AI research.",
  "description": "Our embedded solutions are the direct result of Neryva’s foundational lab research into spatial reasoning, model quantization, and cross-domain task transfer.",
  "artifacts": [
    {
      "title": "Evaluating Zero-Shot Task Transfer: Translating Natural Language into Kinematic Constraints.",
      "type": "Research Artifact",
      "href": "/research/zero-shot-kinematics"
    }
  ]
}
```

### Why this execution is perfectly aligned:
1. **Focus on "The Edge":** In robotics, latency is physical danger. By explicitly stating that our models run locally (without cloud dependency), we solve the #1 objection of any robotics engineer.
2. **Solves a Massive Pain Point (ROS Diagnostics):** Step 01 targets the most painful part of robotics—reading log files. By applying the "Neryva Enterprise Assistant" to ROS bag files, we give them an incredibly practical, sellable use-case.
3. **Respects Safety Constraints:** The "Firmware-Level Security" point acknowledges that AI should *never* override hardware fail-safes. This is exactly what a VP of Hardware needs to hear to trust an AI company.

This data is fully locked in, rigorously researched, and completely free of "slop."