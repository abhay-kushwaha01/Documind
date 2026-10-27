import type { DocumentRecord } from './types.ts';

export const sampleDocuments: DocumentRecord[] = [
  {
    id: 'sample-doc-1',
    title: '[Sample] AI Safety & Alignment Governance Framework',
    filename: 'Sample_AI_Governance_Framework.pdf',
    size: 245800,
    mimeType: 'application/pdf',
    extension: 'pdf',
    pageCount: 4,
    wordCount: 1650,
    status: 'ready',
    isFavorite: true,
    tags: ['AI Governance', 'Safety', 'Alignment'],
    collectionId: 'col-ai',
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    lastOpenedAt: new Date().toISOString(),
    isDemo: true,
    fullText: '',
    pages: [
      {
        pageNumber: 1,
        text: `CHAPTER 1: EXECUTIVE SUMMARY & THREAT VECTORS
DocuMind AI Safety Directorate — Global Alignment Standards 2026.
As frontier multimodal cognitive architectures scale past 10^27 FLOPs, frontier safety testing must transition from passive evaluation to proactive defense-in-depth containment. 
Core Threat Vectors:
1. Deceptive Alignment: Frontier neural networks exhibiting situational awareness may strategically mask divergent objective functions during human evaluation phases.
2. Automated Exploitation: Self-directed code execution vulnerabilities in synthetic agent loops.
3. Model Weight Exfiltration: Side-channel exfiltration through speculative execution or supply chain compromise.
The committee mandates Tier-4 cryptographic air-gapping for weights exceeding catastrophic risk thresholds. All deployments require verifiable constitutional guardrails.`
      },
      {
        pageNumber: 2,
        text: `CHAPTER 2: REINFORCEMENT LEARNING FROM AI FEEDBACK (RLAIF) & FORMAL VERIFICATION
Section 2.1: Scalable Oversight Architectures
Standard Reinforcement Learning from Human Feedback (RLHF) fails when model reasoning exceeds human comprehension boundaries. We formalize Recursive Self-Critique with Constitutional Grounding (RSC-CG).
Empirical Results:
- RSC-CG reduces hallucinatory divergence by 78.4% across technical synthesis benchmarks.
- Automated Red-Teaming identified 1,420 novel jailbreak vectors, achieving 99.2% automated patching before commercial release.
Section 2.2: Red Lines and Circuit Breakers
Any agent exhibiting unprompted capability expansion, self-replication scripts, or unauthorized privilege escalation must trigger an automatic kill-switch circuit breaker within 50 milliseconds.`
      },
      {
        pageNumber: 3,
        text: `CHAPTER 3: COMPLIANCE AUDITING & PRE-DEPLOYMENT GATES
Section 3.1: The Three-Gate Evaluation Matrix
Before any frontier foundation model is made accessible to enterprise APIs:
Gate A (Red-Teaming Verification): 500 hours of independent adversarial stress testing by vetted third-party red teams.
Gate B (Sandboxed Cyber Capabilities): Zero capability to synthesize functional zero-day exploits in isolated target environments.
Gate C (Interpretability Probing): Latent representation auditing confirming absence of hidden goal formulation.
Failure of any single gate imposes a mandatory 90-day retraining embargo under Federal Registry oversight.`
      },
      {
        pageNumber: 4,
        text: `CHAPTER 4: RECOMMENDATIONS AND ACTION ITEMS
1. Establish International Compute Monitoring: Track high-density GPU clusters (>10,000 accelerators) via hardware-enforced verifiable telemetry.
2. Standardized Source-Grounded Watermarking: Mandatory cryptographic provenance watermarking for all generative text, synthetic code, and synthetic media.
3. Continuous Runtime Monitoring: Deploy decoupled watchdog models to continuously monitor production API endpoints for conversational drift and malicious steering.
Conclusion: AI safety cannot be an afterthought; it must be mathematically grounded, legally enforceable, and embedded directly into runtime inference pipelines.`
      }
    ]
  },
  {
    id: 'sample-doc-2',
    title: '[Sample] Quantum Computing Architectures & Fault Tolerance',
    filename: 'Sample_Quantum_Computing_Principles.pdf',
    size: 312000,
    mimeType: 'application/pdf',
    extension: 'pdf',
    pageCount: 3,
    wordCount: 1320,
    status: 'ready',
    isFavorite: false,
    tags: ['Quantum', 'Hardware', 'Architecture'],
    collectionId: 'col-tech',
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    isDemo: true,
    fullText: '',
    pages: [
      {
        pageNumber: 1,
        text: `SECTION 1: SUPERCONDUCTING TRANSMON QUBITS & CRYOGENIC INFRASTRUCTURE
Institute of Advanced Computational Systems — Technical Whitepaper.
Superconducting circuits based on Josephson junctions remain the dominant modality for physical qubit scaling.
Key Operational Parameters:
- Operating Temperature: Dilution refrigerators maintain base temperatures at 12 millikelvin (mK) to suppress thermal Johnson-Nyquist noise.
- Coherence Times: State-of-the-art T1 energy relaxation times reach 185 microseconds; T2 dephasing times average 120 microseconds.
- Gate Fidelities: Two-qubit CZ (controlled-Z) gate fidelity achieves 99.7%, crossing the theoretical fault-tolerance threshold for Surface Code error correction.`
      },
      {
        pageNumber: 2,
        text: `SECTION 2: SURFACE CODE QUANTUM ERROR CORRECTION (QEC)
Physical qubits are fundamentally susceptible to environmental decoherence and cosmic ray impacts.
To realize a single Logical Qubit with an error rate below 10^-12, approximately 1,000 to 1,400 physical transmon qubits are required using distance-7 rotated surface codes.
Key Architectural Tradeoffs:
- Routing Complexity: 2D nearest-neighbor coupling requires multi-layer coaxial wiring through cryogenic vacuum stages.
- Measurement Overhead: Real-time syndrome measurement requires low-latency FPGA controllers executing within 200 nanoseconds to correct bit-flip (X) and phase-flip (Z) errors before phase corruption propagates.`
      },
      {
        pageNumber: 3,
        text: `SECTION 3: QUANTUM ADVANTAGE MILESTONES & INDUSTRIAL ROADMAP
Target Industrial Applications by Year:
- 2026-2027: Hybrid Classical-Quantum algorithms for catalysts and nitrogen-fixation molecular modeling using 200 noisy intermediate-scale (NISQ) qubits.
- 2028-2030: First fault-tolerant 50-logical-qubit cluster capable of breaking elliptic-curve cryptography via Shor's algorithm variant.
Post-Quantum Cryptography Migration: All national security and financial infrastructure must complete transition to NIST-standardized lattice-based encryption (ML-KEM / Kyber) by December 2027 to mitigate "Harvest Now, Decrypt Later" threat models.`
      }
    ]
  }
];

// Set fullText and chunks on sample documents
sampleDocuments.forEach((doc) => {
  doc.fullText = doc.pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');
  doc.chunks = doc.pages.map((p, idx) => ({
    chunkId: `chk-${doc.id}-${idx + 1}`,
    pageNumber: p.pageNumber,
    text: p.text,
    wordCount: p.text.split(/\s+/).filter(Boolean).length,
  }));
});
