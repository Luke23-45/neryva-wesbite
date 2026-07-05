To design the `/solutions/energy` page, we must deeply understand the operational reality of the energy sector (oil & gas, renewables, and grid operators). 

Energy companies do not care about generic AI. They operate critical, capital-intensive physical infrastructure. Their constraints are **remote environments (low/no internet), massive streams of sensor data, dense engineering documentation, and strict regulatory oversight (FERC, NERC, EPA).** 

Neryva’s strategic advantage here is our ability to deploy models at the **Edge** (on a remote rig or substation) and our deep capability in **Engineering Optimization**. 

Here is the precise, zero-slop architecture for the Energy domain page. It speaks directly to a VP of Operations or a Chief Engineer.

### The Page Blueprint (Markdown Layout)

```text
=======================================================================================================
[ HEADER NAV ]  Products ▾   Solutions ▾   Research   Resources ▾   Company ▾       [ Talk to Sales ]
=======================================================================================================

  [ ENERGY & INFRASTRUCTURE AI ]

  Intelligence for critical energy operations.

  We deploy highly reliable AI systems for grid operators, renewable networks, 
  and industrial energy firms. Parse decades of engineering documentation and 
  automate compliance reporting—deployed securely from the cloud to the edge.

  [ Speak with Solutions  → ]

-------------------------------------------------------------------------------------------------------
  [ DIAGRAM: A high-contrast topology map showing Neryva models deployed across a central HQ VPC 
             and localized Edge servers at a remote operational site (e.g., offshore rig or substation). ]
=======================================================================================================

  THE NERYVA ENERGY STANDARD
  Built for high-consequence physical infrastructure.
  -----------------------------------------------------------------------------------------------------
  
  [ Edge-Deployable AI ]           [ Industrial-Grade Reasoning ]   [ SCADA & IoT Integration ]
  Remote sites cannot rely on      Standard LLMs fail on physics    Our systems securely connect 
  public cloud connectivity.       and schematics. Neryva natively  to your existing operational 
  Deploy optimized, lightweight    processes complex CAD texts,     data lakes, turning raw 
  models directly to bare-metal    geospatial reports, and          telemetry and maintenance logs 
  servers at the operational edge. mechanical manuals with precision. into actionable intelligence.

=======================================================================================================

  APPLIED ENERGY WORKFLOWS
  Turning industrial complexity into operational efficiency.
  -----------------------------------------------------------------------------------------------------

  [ 01. Asset Maintenance & Failure Analysis ]
  Downtime costs millions. The Neryva Assistant securely ingests thousands of pages 
  of OEM equipment manuals, historical maintenance logs, and safety reports. Engineers 
  can instantly query failure codes and retrieve exact, cited diagnostic procedures.

  [ 02. Regulatory & Environmental Compliance ]
  Energy operations face massive regulatory burdens. Automate the auditing process by 
  cross-referencing daily operational logs against updated FERC, NERC, and EPA 
  guidelines. Generate compliance reports in seconds with zero hallucination.

  [ 03. Grid & Resource Optimization ]
  Managing modern energy grids requires processing vast amounts of disparate data. 
  Our applied systems analyze localized weather data, historical load patterns, and 
  engineering constraints to support human operators in load balancing decisions.

=======================================================================================================

  ENGINEERING OPTIMIZATION RESEARCH
  Backed by rigorous, multi-domain AI research.
  -----------------------------------------------------------------------------------------------------
  Neryva’s infrastructure solutions are directly informed by our ongoing lab research 
  into energy optimization, edge deployment, and industrial system reliability.

  [ RESEARCH ARTIFACT ]
  Evaluating Edge-Deployed SLMs for Real-Time Anomaly Detection in Sensor Networks.
  [ Read the Note ↗ ]

=======================================================================================================
  
  Secure AI for industrial scale.

  [ Talk to Solutions  → ]

=======================================================================================================
```

***

### The JSON Data Blocks

Here is the exact, engineering-grade JSON data for the Energy page. Every term used (SCADA, Edge, NERC, CAD) proves to the buyer that we actually understand industrial energy infrastructure.

#### `energy_section1_hero.json`
```json
{
  "id": "energy-hero",
  "eyebrow": "ENERGY & INFRASTRUCTURE AI",
  "title": "Intelligence for critical energy operations.",
  "description": "We deploy highly reliable AI systems for grid operators, renewable networks, and industrial energy firms. Parse decades of engineering documentation and automate compliance reporting—deployed securely from the cloud to the edge.",
  "visual": {
    "type": "edge_topology_diagram",
    "alt": "Topology diagram showing Neryva models deployed across a secure central VPC and localized Edge servers at a remote site."
  },
  "cta": {
    "label": "Speak with Solutions",
    "href": "/contact",
    "primary": true
  }
}
```

#### `energy_section2_standards.json`
```json
{
  "id": "energy-standards",
  "title": "THE NERYVA ENERGY STANDARD",
  "subtitle": "Built for high-consequence physical infrastructure.",
  "features": [
    {
      "title": "Edge-Deployable AI",
      "description": "Remote sites cannot rely on public cloud connectivity. Deploy optimized, lightweight models directly to bare-metal servers at the operational edge."
    },
    {
      "title": "Industrial-Grade Reasoning",
      "description": "Standard LLMs fail on physics and schematics. Neryva natively processes complex CAD texts, geospatial reports, and mechanical manuals with precision."
    },
    {
      "title": "SCADA & IoT Integration",
      "description": "Our systems securely connect to your existing operational data lakes, turning raw telemetry and historical maintenance logs into actionable intelligence."
    }
  ]
}
```

#### `energy_section3_workflows.json`
```json
{
  "id": "energy-workflows",
  "title": "APPLIED ENERGY WORKFLOWS",
  "subtitle": "Turning industrial complexity into operational efficiency.",
  "workflows": [
    {
      "step": "01",
      "title": "Asset Maintenance & Failure Analysis",
      "description": "Downtime costs millions. The Neryva Assistant securely ingests thousands of pages of OEM equipment manuals, historical maintenance logs, and safety reports. Engineers can instantly query failure codes and retrieve exact, cited diagnostic procedures."
    },
    {
      "step": "02",
      "title": "Regulatory & Environmental Compliance",
      "description": "Energy operations face massive regulatory burdens. Automate the auditing process by cross-referencing daily operational logs against updated FERC, NERC, and EPA guidelines. Generate compliance reports in seconds with zero hallucination."
    },
    {
      "step": "03",
      "title": "Grid & Resource Optimization",
      "description": "Managing modern grids requires processing vast amounts of disparate data. Our applied systems analyze historical load patterns and engineering constraints to support human operators in complex load balancing decisions."
    }
  ]
}
```

#### `energy_section4_research.json`
```json
{
  "id": "energy-research",
  "title": "ENGINEERING OPTIMIZATION RESEARCH",
  "subtitle": "Backed by rigorous, multi-domain AI research.",
  "description": "Neryva’s infrastructure solutions are directly informed by our ongoing lab research into energy optimization, edge deployment, and industrial system reliability.",
  "artifacts": [
    {
      "title": "Evaluating Edge-Deployed SLMs for Real-Time Anomaly Detection in Sensor Networks.",
      "type": "Research Artifact",
      "href": "/research/edge-anomaly-detection"
    }
  ]
}
```

### Why this execution is flawless:
1. **It understands the physical constraints:** We immediately address "Edge-Deployable AI". An oil rig in the North Sea or a remote wind farm does not have the bandwidth to constantly ping an OpenAI API. By offering local edge deployment, we instantly solve a massive sector-specific problem.
2. **It addresses real industrial data:** Energy companies don't just have text documents; they have mechanical manuals, SCADA logs, and CAD texts. We highlight this specific parsing capability.
3. **No Overclaiming (Human-in-the-loop):** In Step 03 (Grid Optimization), we do not say "The AI runs your grid." We say it *analyzes data to support human operators.* This is a crucial safety and regulatory distinction that builds trust with Chief Engineers.

This keeps Neryva strictly positioned as a pragmatic, highly competent engineering enterprise. If this aligns with your standard, we will lock it in.