
Here is exactly how this layout functions:
1. **Left Sidebar:** A fixed, sticky navigation menu that tracks the user's progress through the pipeline.
2. **Right Content Area (Main):** 
   - A large, factual section header (e.g., "2. Model training.").
   - A wide, high-fidelity visual or diagram proving the concept.
   - A strict **3-column text grid** underneath the visual that breaks down the technical specifics.

This is the exact layout we will use for the **Neryva Enterprise Assistant** product page. It eliminates all "slop" because it forces us to explain the system sequentially: how data gets in, how it reasons, how it acts, and how it is secured.

Here is the final, locked-in structural flow, mapping Neryva's capabilities directly into this layout. 

***

### The Final Layout Architecture (Markdown Wireframe)

```text
=======================================================================================================
[ HEADER NAV ]                                                                    [ Talk to Solutions ]
=======================================================================================================
                                        [ FLAGSHIP SYSTEM ]
                                    Neryva Enterprise Assistant

               The secure AI interface for your organization. Deploy reasoning-driven 
               assistants that execute workflows and resolve inquiries—hosted entirely 
                        within your own infrastructure without cloud lock-in.
=======================================================================================================

[ LEFT SIDEBAR: STICKY NAV ]      |  [ RIGHT CONTENT AREA: SCROLLING ]
                                  |
1. Data integration               |  1. Data integration.
                                  |  ------------------------------------------------------------------
2. Deep reasoning                 |  
                                  |  +-------------------------------------------------------------+
3. Workflow execution             |  | [ DIAGRAM: Schema showing connectors from Confluence, Jira, |
                                  |  |   and S3 flowing into a secure Neryva Vector Index ]        |
4. Profile management             |  +-------------------------------------------------------------+
                                  |  
5. Deployment & security          |  [ Enterprise connectors. ]  [ Permissions sync. ]  [ Real-time indexing. ]
                                  |  Native integrations         Respects existing IAM  Continuous updates 
                                  |  with standard data silos.   and RBAC controls.     ensure accurate data.
                                  |
                                  |====================================================================
                                  |
  (User scrolls down)             |  2. Deep reasoning.
  (Sidebar updates active state)  |  ------------------------------------------------------------------
                                  |
1. Data integration               |  +-------------------------------------------------------------+
                                  |  | [ UI MOCKUP: User asks about ISO-9001 compliance. Assistant |
2. Deep reasoning             ←   |  |   answers and cites exact page/paragraph from a 200pg PDF ] |
                                  |  +-------------------------------------------------------------+
3. Workflow execution             |  
                                  |  [ Strict citations. ]       [ Multi-format parsing. ] [ Contextual memory. ]
4. Profile management             |  Every claim is grounded     Reads complex PDFs,       Retains thread history
                                  |  in source documentation     tabular data, and         for complex, multi-turn
5. Deployment & security          |  to prevent hallucination.   technical schematics.     organizational tasks.
                                  |
                                  |====================================================================
                                  |
  (User scrolls down)             |  3. Workflow execution.
                                  |  ------------------------------------------------------------------
                                  |
1. Data integration               |  +-------------------------------------------------------------+
                                  |  | [ TERMINAL: Log showing an anomaly detected, followed by a  |
2. Deep reasoning                 |  |   POST to /jira/api/v2 and a Slack webhook trigger ]        |
                                  |  +-------------------------------------------------------------+
3. Workflow execution         ←   |  
                                  |  [ API triggering. ]         [ Multi-step autonomy. ]  [ Human-in-the-loop. ]
4. Profile management             |  Connects reasoning to       Capable of chaining       Configurable approval 
                                  |  action via internal         actions to complete       gates for high-
5. Deployment & security          |  company endpoints.          end-to-end tasks.         consequence actions.
                                  |
                                  |====================================================================
                                  |
  (User scrolls down)             |  4. Profile management.
                                  |  ------------------------------------------------------------------
                                  |
1. Data integration               |  +-------------------------------------------------------------+
                                  |  | [ UI TOGGLE: Switching context from "Internal Ops Profile"  |
2. Deep reasoning                 |  |   (Full Access) to "Customer Profile" (Public Docs Only) ]  |
                                  |  +-------------------------------------------------------------+
3. Workflow execution             |  
                                  |  [ Dual-agent architecture. ][ Boundary enforcement. ] [ Custom instructions. ]
4. Profile management         ←   |  Serve internal teams and    Strict logical separation Tailor the behavior,
                                  |  external customers from     of data access based      tone, and boundaries
5. Deployment & security          |  one underlying system.      on the active profile.    per deployment.
                                  |
                                  |====================================================================
                                  |
  (User scrolls down)             |  5. Deployment & security.
                                  |  ------------------------------------------------------------------
                                  |
1. Data integration               |  +-------------------------------------------------------------+
                                  |  | [ DIAGRAM: Network topology showing VPC peering, On-prem,   |
2. Deep reasoning                 |  |   and secure air-gapped deployment pathways. ]              |
                                  |  +-------------------------------------------------------------+
3. Workflow execution             |  
                                  |  [ Zero-trust infrastructure][ No model training. ]    [ Comprehensive audit. ]
4. Profile management             |  Deploy on-premise,          We never train our        Full traceability of 
                                  |  in your VPC, or via         foundational models on    every query, citation,
5. Deployment & security      ←   |  secure enterprise cloud.    your proprietary inputs.  and executed workflow.
                                  |
=======================================================================================================
```

