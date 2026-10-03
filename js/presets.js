/**
 * Presets for research and project management Gantt charts
 */
export const PRESETS = {
  horizon_europe: {
    meta: {
      title: "HYPER-AI: Resilient Distributed Edge Intelligence",
      subtitle: "EU Horizon Europe Research & Innovation Action (RIA) — Grant Agreement #10109988",
      timeMode: "project_months", // "project_months" | "calendar" | "quarters"
      startDate: "2026-01-01",
      totalMonths: 36,
      theme: "academic",
      showProgress: true,
      showMilestones: true,
      showDeliverables: true,
      showDependencies: true,
      showGrid: true,
      rowHeight: 38,
      monthWidth: 44,
      compactView: false
    },
    workPackages: [
      { id: "wp1", code: "WP1", name: "Management, Ethics & Data Governance", color: "#2563eb" },
      { id: "wp2", code: "WP2", name: "Foundational Edge Models & Optimization", color: "#0d9488" },
      { id: "wp3", code: "WP3", name: "Distributed Middleware & Toolchain", color: "#8b5cf6" },
      { id: "wp4", code: "WP4", name: "Real-World Industrial Pilot Trials", color: "#f59e0b" },
      { id: "wp5", code: "WP5", name: "Dissemination, Exploitation & Open Science", color: "#ec4899" }
    ],
    items: [
      // WP1
      { id: "t1_1", wpId: "wp1", type: "task", code: "T1.1", title: "Consortium Coordination & Legal Management", startMonth: 1, endMonth: 36, progress: 30, lead: "Coordinator (Uni A)", notes: "Regular GA meetings and administrative oversight" },
      { id: "t1_2", wpId: "wp1", type: "task", code: "T1.2", title: "Data Management Plan (DMP) & Ethics Compliance", startMonth: 1, endMonth: 8, progress: 85, lead: "Ethics Board", notes: "FAIR data compliance and GDPR audit" },
      { id: "d1_1", wpId: "wp1", type: "deliverable", code: "D1.1", title: "Data Management & Ethics Plan (v1)", startMonth: 6, endMonth: 6, progress: 100, lead: "Uni A" },
      { id: "m1",   wpId: "wp1", type: "milestone", code: "MS1", title: "Kick-off & Ethics Clearance", startMonth: 2, endMonth: 2, progress: 100, lead: "Consortium" },

      // WP2
      { id: "t2_1", wpId: "wp2", type: "task", code: "T2.1", title: "Taxonomy & Latency Benchmarks", startMonth: 1, endMonth: 7, progress: 100, lead: "Partner B", notes: "Baseline measurement on IoT/edge hardware" },
      { id: "t2_2", wpId: "wp2", type: "task", code: "T2.2", title: "Dynamic Model Quantization & Pruning", startMonth: 5, endMonth: 18, progress: 65, lead: "Partner B", notes: "Sub-4bit quantization with negligible accuracy loss" },
      { id: "t2_3", wpId: "wp2", type: "task", code: "T2.3", title: "Federated Continual Learning Framework", startMonth: 10, endMonth: 24, progress: 20, lead: "Partner C", notes: "Mitigate catastrophic forgetting in non-IID edge nodes" },
      { id: "d2_1", wpId: "wp2", type: "deliverable", code: "D2.1", title: "State-of-the-Art Benchmark Suite", startMonth: 7, endMonth: 7, progress: 100, lead: "Partner B" },
      { id: "m2",   wpId: "wp2", type: "milestone", code: "MS2", title: "Core Compression Engine Validated", startMonth: 16, endMonth: 16, progress: 50, lead: "Partner B" },

      // WP3
      { id: "t3_1", wpId: "wp3", type: "task", code: "T3.1", title: "Cross-Platform Edge Runtime Architecture", startMonth: 8, endMonth: 20, progress: 40, lead: "Partner D", notes: "Rust/C++ lightweight runtime for embedded RISC-V & ARM" },
      { id: "t3_2", wpId: "wp3", type: "task", code: "T3.2", title: "Decentralized P2P Orchestration Engine", startMonth: 14, endMonth: 28, progress: 10, lead: "Partner D", notes: "Zero-trust synchronization across mobile nodes" },
      { id: "d3_1", wpId: "wp3", type: "deliverable", code: "D3.1", title: "Open Source Runtime Engine (v1.0)", startMonth: 20, endMonth: 20, progress: 0, lead: "Partner D" },
      { id: "m3",   wpId: "wp3", type: "milestone", code: "MS3", title: "End-to-End Edge Testbed Deployed", startMonth: 22, endMonth: 22, progress: 0, lead: "Partner C & D" },

      // WP4
      { id: "t4_1", wpId: "wp4", type: "task", code: "T4.1", title: "Smart Grid Pilot: Grid Anomaly Detection", startMonth: 18, endMonth: 32, progress: 0, lead: "Industry Partner E", notes: "Deployment in 5 substations" },
      { id: "t4_2", wpId: "wp4", type: "task", code: "T4.2", title: "Autonomous Robotics Pilot: Fleet Teleoperation", startMonth: 22, endMonth: 34, progress: 0, lead: "Industry Partner F", notes: "Latency-critical SLAM and path planning" },
      { id: "d4_1", wpId: "wp4", type: "deliverable", code: "D4.1", title: "Pilot Trial Empirical Evaluation Report", startMonth: 34, endMonth: 34, progress: 0, lead: "Partner E & F" },

      // WP5
      { id: "t5_1", wpId: "wp5", type: "task", code: "T5.1", title: "Academic Dissemination (Journals & Conferences)", startMonth: 6, endMonth: 36, progress: 25, lead: "Uni A & B", notes: "Open-access targeting NeurIPS, ICML, IEEE TPAMI" },
      { id: "t5_2", wpId: "wp5", type: "task", code: "T5.2", title: "Standardization & Open Source Community Building", startMonth: 12, endMonth: 36, progress: 10, lead: "Partner D", notes: "Contributions to Linux Foundation Edge / IEEE" },
      { id: "m4",   wpId: "wp5", type: "milestone", code: "MS4", title: "Mid-Term Technical Review", startMonth: 18, endMonth: 18, progress: 0, lead: "All Partners" },
      { id: "m5",   wpId: "wp5", type: "milestone", code: "MS5", title: "Final Review & Public Demonstrator", startMonth: 36, endMonth: 36, progress: 0, lead: "All Partners" }
    ]
  },

  phd_plan: {
    meta: {
      title: "Doctoral Research Roadmap: Neural Program Synthesis",
      subtitle: "PhD Dissertation Plan — Department of Computer Science (48 Months)",
      timeMode: "project_months",
      startDate: "2026-10-01",
      totalMonths: 48,
      theme: "ocean",
      showProgress: true,
      showMilestones: true,
      showDeliverables: true,
      showDependencies: true,
      showGrid: true,
      rowHeight: 38,
      monthWidth: 38,
      compactView: false
    },
    workPackages: [
      { id: "wp1", code: "Y1", name: "Year 1: Foundations & Systematic Survey", color: "#0284c7" },
      { id: "wp2", code: "Y2", name: "Year 2: Novel Neuro-Symbolic Search", color: "#059669" },
      { id: "wp3", code: "Y3", name: "Year 3: Scalability & Verification Guarantees", color: "#7c3aed" },
      { id: "wp4", code: "Y4", name: "Year 4: Synthesis, Thesis Writing & Defense", color: "#db2777" }
    ],
    items: [
      // Y1
      { id: "p1_1", wpId: "wp1", type: "task", code: "T1.1", title: "Literature Survey & Benchmark Construction", startMonth: 1, endMonth: 7, progress: 100, lead: "Candidate", notes: "Analyze existing SOTA LLM code synthesis methods" },
      { id: "p1_2", wpId: "wp1", type: "task", code: "T1.2", title: "Coursework & Teaching Assistantship (TA)", startMonth: 1, endMonth: 9, progress: 100, lead: "Candidate", notes: "Advanced compilers, automated reasoning" },
      { id: "p1_3", wpId: "wp1", type: "task", code: "T1.3", title: "Formal PhD Research Proposal Preparation", startMonth: 7, endMonth: 12, progress: 90, lead: "Candidate & Advisor" },
      { id: "pm1",  wpId: "wp1", type: "milestone", code: "M1", title: "PhD Candidacy Defense (Qualifying Exam)", startMonth: 12, endMonth: 12, progress: 100, lead: "Doctoral Committee" },

      // Y2
      { id: "p2_1", wpId: "wp2", type: "task", code: "T2.1", title: "Neuro-Symbolic Grammar-Constrained Decoding", startMonth: 11, endMonth: 20, progress: 60, lead: "Candidate", notes: "Integrate Tree-sitter AST validation inside beam search" },
      { id: "p2_2", wpId: "wp2", type: "task", code: "T2.2", title: "Empirical Evaluation on HumanEval & SWE-bench", startMonth: 18, endMonth: 24, progress: 20, lead: "Candidate" },
      { id: "pd1",  wpId: "wp2", type: "deliverable", code: "D1", title: "First Author Conference Submission (PLDI / POPL)", startMonth: 22, endMonth: 22, progress: 0, lead: "Candidate" },
      { id: "pm2",  wpId: "wp2", type: "milestone", code: "M2", title: "Second-Year Progress Review", startMonth: 24, endMonth: 24, progress: 0, lead: "Advisor" },

      // Y3
      { id: "p3_1", wpId: "wp3", type: "task", code: "T3.1", title: "Automated Formal Verification of Synthesized Code", startMonth: 23, endMonth: 34, progress: 0, lead: "Candidate", notes: "SMT solver integration (Z3) for proof guarantees" },
      { id: "p3_2", wpId: "wp3", type: "task", code: "T3.2", title: "Industry Research Internship (3-4 Months)", startMonth: 30, endMonth: 34, progress: 0, lead: "Host Lab" },
      { id: "pd2",  wpId: "wp3", type: "deliverable", code: "D2", title: "Top-Tier Journal Paper (ACM TOPLAS)", startMonth: 36, endMonth: 36, progress: 0, lead: "Candidate" },

      // Y4
      { id: "p4_1", wpId: "wp4", type: "task", code: "T4.1", title: "System Integration & Unified Benchmark Toolkit", startMonth: 35, endMonth: 41, progress: 0, lead: "Candidate" },
      { id: "p4_2", wpId: "wp4", type: "task", code: "T4.2", title: "Dissertation Manuscript Drafting & Revisions", startMonth: 39, endMonth: 46, progress: 0, lead: "Candidate & Committee" },
      { id: "pm3",  wpId: "wp4", type: "milestone", code: "M3", title: "Dissertation Submission to Examiners", startMonth: 46, endMonth: 46, progress: 0, lead: "Candidate" },
      { id: "pm4",  wpId: "wp4", type: "milestone", code: "M4", title: "Final Oral Defense & Degree Conferred", startMonth: 48, endMonth: 48, progress: 0, lead: "Committee" }
    ]
  },

  rnd_product: {
    meta: {
      title: "BioSense: Point-of-Care Biosensor Platform",
      subtitle: "Translational R&D & Product Commercialization Roadmap (18 Months)",
      timeMode: "project_months",
      startDate: "2026-03-01",
      totalMonths: 18,
      theme: "emerald",
      showProgress: true,
      showMilestones: true,
      showDeliverables: true,
      showDependencies: true,
      showGrid: true,
      rowHeight: 38,
      monthWidth: 54,
      compactView: false
    },
    workPackages: [
      { id: "wp1", code: "Phase 1", name: "Microfluidic Chip Design & Assay Chemistry", color: "#059669" },
      { id: "wp2", code: "Phase 2", name: "Optoelectronic Reader & Embedded Firmware", color: "#2563eb" },
      { id: "wp3", code: "Phase 3", name: "Clinical Pilot Testing & Regulatory (CE/FDA)", color: "#d97706" },
      { id: "wp4", code: "Phase 4", name: "Manufacturing Transfer & Spin-off Launch", color: "#9333ea" }
    ],
    items: [
      { id: "r1_1", wpId: "wp1", type: "task", code: "T1.1", title: "Nanomaterial Surface Functionalization", startMonth: 1, endMonth: 5, progress: 100, lead: "Chemistry Team" },
      { id: "r1_2", wpId: "wp1", type: "task", code: "T1.2", title: "Rapid Injection Molding Chip Prototyping", startMonth: 3, endMonth: 8, progress: 80, lead: "Bioengineering" },
      { id: "rm1",  wpId: "wp1", type: "milestone", code: "M1", title: "Proof-of-Concept Assay Detection Limit Met", startMonth: 6, endMonth: 6, progress: 100, lead: "All" },

      { id: "r2_1", wpId: "wp2", type: "task", code: "T2.1", title: "Photodiode Array & Low-Noise Amplification", startMonth: 4, endMonth: 10, progress: 50, lead: "Hardware Team" },
      { id: "r2_2", wpId: "wp2", type: "task", code: "T2.2", title: "Edge Processing Algorithm & Mobile App Sync", startMonth: 7, endMonth: 13, progress: 30, lead: "Software Team" },
      { id: "rd1",  wpId: "wp2", type: "deliverable", code: "D1", title: "Handheld Reader Prototype v1.0", startMonth: 11, endMonth: 11, progress: 0, lead: "Hardware" },

      { id: "r3_1", wpId: "wp3", type: "task", code: "T3.1", title: "IRB Clinical Protocol & Patient Cohort Study", startMonth: 10, endMonth: 16, progress: 0, lead: "Clinical Partner" },
      { id: "r3_2", wpId: "wp3", type: "task", code: "T3.2", title: "ISO 13485 QMS Audit & Technical Dossier", startMonth: 12, endMonth: 17, progress: 0, lead: "Regulatory" },
      { id: "rm2",  wpId: "wp3", type: "milestone", code: "M2", title: "Clinical Sensitivity >96% Validated", startMonth: 15, endMonth: 15, progress: 0, lead: "Clinical" },

      { id: "r4_1", wpId: "wp4", type: "task", code: "T4.1", title: "Pilot Line Contract Manufacturer Setup", startMonth: 14, endMonth: 18, progress: 0, lead: "Ops Team" },
      { id: "rd2",  wpId: "wp4", type: "deliverable", code: "D2", title: "Final Commercial Transfer Dossier", startMonth: 18, endMonth: 18, progress: 0, lead: "Ops" },
      { id: "rm3",  wpId: "wp4", type: "milestone", code: "M3", title: "Series A / Commercial Licensing Closed", startMonth: 18, endMonth: 18, progress: 0, lead: "Execs" }
    ]
  },

  blank: {
    meta: {
      title: "My Research Project",
      subtitle: "Strategic Timeline & Deliverables",
      timeMode: "project_months",
      startDate: "2026-01-01",
      totalMonths: 24,
      theme: "academic",
      showProgress: true,
      showMilestones: true,
      showDeliverables: true,
      showDependencies: true,
      showGrid: true,
      rowHeight: 38,
      monthWidth: 46,
      compactView: false
    },
    workPackages: [
      { id: "wp1", code: "WP1", name: "Research Stream 1", color: "#2563eb" },
      { id: "wp2", code: "WP2", name: "Research Stream 2", color: "#0d9488" }
    ],
    items: [
      { id: "b1", wpId: "wp1", type: "task", code: "T1.1", title: "Initial Scoping & Literature Review", startMonth: 1, endMonth: 4, progress: 50, lead: "Lead Researcher", notes: "" },
      { id: "bm1", wpId: "wp1", type: "milestone", code: "M1", title: "Methodology Finalized", startMonth: 4, endMonth: 4, progress: 0, lead: "Team", notes: "" },
      { id: "b2", wpId: "wp2", type: "task", code: "T2.1", title: "Experimental Evaluation & Data Collection", startMonth: 5, endMonth: 14, progress: 0, lead: "Co-Investigator", notes: "" },
      { id: "bd1", wpId: "wp2", type: "deliverable", code: "D2.1", title: "Technical Report & Benchmark Release", startMonth: 14, endMonth: 14, progress: 0, lead: "Team", notes: "" }
    ]
  }
};
