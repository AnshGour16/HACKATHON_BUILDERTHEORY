export interface IMockCandidateApplication {
    _id: string;
    job: {
        _id: string;
        title: string;
        companyName: string;
        department: string;
        evaluationType: 'TECHNICAL_GITHUB' | 'CASE_STUDY';
        requiredSkills: string[];
        rubricCriteria?: Array<{ criterion: string; weightage: number; description?: string }>;
    };
    candidate: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
    };
    candidateProfile?: {
        headline?: string;
        location?: string;
        phone?: string;
        bio?: string;
        resumeFileName?: string;
        parsedSkills?: string[];
        experience?: Array<{ role: string; company: string; duration: string; description: string }>;
        education?: Array<{ degree: string; institution: string; year: string }>;
        githubUrl?: string;
        portfolioUrl?: string;
        linkedinUrl?: string;
    };
    status: 'APPLIED' | 'SCREENING' | 'ASSESSMENT' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
    matchScore: number;
    aiEvaluation?: {
        overallMatchScore: number;
        resumeScore: number;
        practicalScore?: number;
        criteriaScores?: Array<{
            criterion: string;
            score: number;
            weightage: number;
            reasoning: string;
        }>;
        summary: string;
        strengths: string[];
        weaknesses: string[];
        missingSkills: string[];
        recommendations: string[];
        interviewQuestions?: string[];
        githubAudit?: {
            repoUrl?: string;
            technicalScore?: number;
            codeQualityScore?: number;
            architectureScore?: number;
            testingScore?: number;
            summary?: string;
        };
        assignmentAudit?: {
            score?: number;
            feedback?: string;
        };
        evaluatedAt?: string;
    };
    githubUrl?: string;
    assignmentSubmission?: string;
    recruiterNotes?: string;
    interviewScheduledDate?: string;
    rating?: number;
    appliedAt: string;
}

export const INITIAL_MOCK_APPLICATIONS: Record<string, IMockCandidateApplication> = {
    'mock-1': {
        _id: 'mock-1',
        job: {
            _id: 'j1',
            title: 'Senior Software Engineer',
            companyName: 'CloudScale Systems',
            department: 'Software & IT',
            evaluationType: 'TECHNICAL_GITHUB',
            requiredSkills: ['Python', 'SQL', 'FastAPI', 'Distributed Systems', 'PostgreSQL', 'Docker', 'AWS'],
            rubricCriteria: [
                { criterion: 'System Architecture & Microservices', weightage: 30, description: 'Modular design, decoupled service boundaries, and fault tolerance.' },
                { criterion: 'Code Quality, Types & Standards', weightage: 30, description: 'Idiomatic typing, maintainable modules, and error handling.' },
                { criterion: 'Database Modeling & Performance', weightage: 20, description: 'Indexing, query optimization, and connection pooling.' },
                { criterion: 'Automated Testing & Reliability', weightage: 20, description: 'Unit/integration test coverage and mock fixtures.' }
            ]
        },
        candidate: {
            _id: 'c1',
            name: 'Damson',
            email: 'damson@example.com',
            phone: '+1 (555) 349-8201',
            avatarUrl: ''
        },
        candidateProfile: {
            headline: 'Senior Backend & Systems Engineer',
            location: 'San Francisco, CA (Hybrid / Remote)',
            parsedSkills: ['Python', 'SQL', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS'],
            resumeFileName: 'Damson_Senior_Backend_Resume.pdf',
            githubUrl: 'https://github.com/damson/distributed-data-pipeline',
            bio: 'Senior Backend & Systems Engineer with 6+ years specializing in distributed systems, high-throughput microservices, and reliable async pipelines.',
            experience: [
                { role: 'Senior Backend Engineer', company: 'DataScale Systems', duration: '2021 - Present', description: 'Architected high-throughput ingestion pipelines processing 40M+ events/day with 99.99% uptime.' },
                { role: 'Software Engineer', company: 'Nexis Tech', duration: '2018 - 2021', description: 'Built REST & gRPC microservices with automated test coverage exceeding 90%.' }
            ],
            education: [
                { degree: 'B.S. in Computer Science', institution: 'University of California, Berkeley', year: '2018' }
            ]
        },
        status: 'APPLIED',
        matchScore: 95,
        githubUrl: 'https://github.com/damson/distributed-data-pipeline',
        aiEvaluation: {
            overallMatchScore: 95,
            resumeScore: 94,
            practicalScore: 96,
            summary: 'Exceptional technical alignment for Senior Software Engineer. Damson demonstrates production-grade code architecture, robust async error handling, modular service boundaries, and comprehensive unit/integration test suites verified via GitHub static audit.',
            strengths: [
                'Decoupled microservices architecture with clean dependency injection',
                'High test coverage with automated mock factories and CI integration',
                'Strong database indexing, connection pooling, and latency optimization',
                'Idiomatic Python typing and comprehensive OpenAPI documentation'
            ],
            weaknesses: [
                'Could provide additional load testing benchmarks for extreme traffic spikes'
            ],
            missingSkills: [
                'Kafka stream processing (candidate has extensive Redis Pub/Sub experience)'
            ],
            recommendations: [
                'Fast-track to technical deep-dive interview with the engineering team',
                'Focus system design discussion on multi-region failover and partition tolerance'
            ],
            criteriaScores: [
                { criterion: 'System Architecture & Microservices', score: 29, weightage: 30, reasoning: 'Modular domain-driven design with clean interface abstractions and separation of concerns.' },
                { criterion: 'Code Quality, Types & Standards', score: 29, weightage: 30, reasoning: 'Strict PEP 8 compliance, exhaustive type annotations, and idiomatic error handling.' },
                { criterion: 'Database Modeling & Performance', score: 19, weightage: 20, reasoning: 'Efficient schema migrations, optimized indexes, and query explain execution plans.' },
                { criterion: 'Automated Testing & Reliability', score: 18, weightage: 20, reasoning: 'Comprehensive PyTest suite with 92% coverage and mock integration fixtures.' }
            ],
            githubAudit: {
                repoUrl: 'https://github.com/damson/distributed-data-pipeline',
                technicalScore: 96,
                codeQualityScore: 24,
                architectureScore: 20,
                testingScore: 15,
                summary: 'Repository passes all static syntax, linting, and architecture audits. Zero high-risk cyclomatic complexity hotspots.'
            },
            interviewQuestions: [
                'Walk us through how your distributed pipeline handles transient worker failures and idempotency.',
                'How did you design database connection pooling to withstand sudden 10x traffic surges?',
                'What trade-offs did you make when choosing between synchronous REST and asynchronous event queues?'
            ],
            evaluatedAt: '2026-11-20T10:30:00.000Z'
        },
        recruiterNotes: 'Top candidate for the CloudScale backend team. Automated static GitHub analysis confirmed 96/100 code rigor.',
        appliedAt: '2026-11-20T10:30:00.000Z'
    },
    'mock-2': {
        _id: 'mock-2',
        job: {
            _id: 'j2',
            title: 'Growth Analyst',
            companyName: 'FinTech Corp',
            department: 'Marketing',
            evaluationType: 'CASE_STUDY',
            requiredSkills: ['Growth Marketing', 'SQL', 'Attribution Modeling', 'A/B Testing', 'Funnel Optimization'],
            rubricCriteria: [
                { criterion: 'Inbound & Growth Marketing', weightage: 30, description: 'Multi-channel acquisition strategies and funnel optimization.' },
                { criterion: 'Attention to Detail & Analytics', weightage: 30, description: 'SQL cohort analysis, CAC/LTV forecasting, and attribution.' },
                { criterion: 'Complementary Practical Skills', weightage: 20, description: 'Pragmatic experiment design and actionable execution.' },
                { criterion: 'Cross-functional Collaboration', weightage: 20, description: 'Stakeholder communication and leadership reporting.' }
            ]
        },
        candidate: {
            _id: 'c2',
            name: 'Sarah',
            email: 'sarah@example.com',
            phone: '+1 (555) 782-9104',
            avatarUrl: ''
        },
        candidateProfile: {
            headline: 'Growth & Inbound Analyst',
            location: 'New York, NY (Remote)',
            parsedSkills: ['Python', 'SQL', 'Project Management', 'Inbound Marketing', 'A/B Testing', 'GA4', 'Mixpanel', 'CAC/LTV Modeling'],
            resumeFileName: 'Sarah_Growth_Analyst_Resume.pdf',
            bio: 'Data-driven growth analyst with 4+ years running end-to-end user acquisition funnels, retention cohorts, and multi-touch attribution models.',
            experience: [
                { role: 'Growth Marketing Analyst', company: 'FinPulse Media', duration: '2022 - Present', description: 'Optimized paid acquisition funnels reducing blended CAC by 28% across B2B SaaS campaigns.' },
                { role: 'Junior Product Analyst', company: 'MetricStream', duration: '2020 - 2022', description: 'Created SQL dashboards and led A/B testing cadence resulting in +15% trial conversions.' }
            ],
            education: [
                { degree: 'B.A. in Quantitative Economics', institution: 'New York University', year: '2020' }
            ]
        },
        status: 'SCREENING',
        matchScore: 89,
        assignmentSubmission: `Executive Growth Strategy & Funnel Optimization Case Study:\n\n1. Executive Summary: Analyzed Q3 B2B user acquisition funnel. Identified a 34% drop-off between trial signup and product activation.\n2. Root Cause: Friction in SSO onboarding and lack of contextual milestone triggers.\n3. Intervention: Designed a 4-step progressive onboarding checklist with automated behavioral Slack/Email webhooks.\n4. Outcome: Modeled +22% activation rate, driving projected CAC reduction from $420 to $310 within 60 days.\n5. Tracking & Attribution: Multi-touch attribution model leveraging SQL dbt models and Mixpanel cohort retention curves.`,
        aiEvaluation: {
            overallMatchScore: 89,
            resumeScore: 90,
            practicalScore: 88,
            summary: 'Strong analytical mindset with proven track record in decreasing CAC by 28% while improving lead-to-opportunity conversion. Practical case study submission shows rigorous statistical hypothesis testing and transparent funnel reporting.',
            strengths: [
                'Multi-touch attribution modeling and cohort retention analysis',
                'Pragmatic A/B testing design with rigorous sample size calculations',
                'Executive-ready cross-channel performance dashboards'
            ],
            weaknesses: [
                'Limited direct experience in organic SEO technical site audits'
            ],
            missingSkills: [
                'Server-side event tracking via Segment Protocols'
            ],
            recommendations: [
                'Schedule Stage 2 phone screening with Growth Director',
                'Validate practical experience with paid ad spend budgeting >$50k/mo'
            ],
            criteriaScores: [
                { criterion: 'Inbound & Growth Marketing', score: 28, weightage: 30, reasoning: 'Strong quantitative funnel optimization and multi-channel campaign strategy.' },
                { criterion: 'Attention to Detail & Analytics', score: 25, weightage: 30, reasoning: 'Solid tracking setup, CAC metrics, and performance reporting framework.' },
                { criterion: 'Complementary Practical Skills', score: 18, weightage: 20, reasoning: 'Practical case study shows structured execution and creative messaging.' },
                { criterion: 'Cross-functional Collaboration', score: 18, weightage: 20, reasoning: 'Strong alignment between product metrics, sales handoff, and leadership reporting.' }
            ],
            assignmentAudit: {
                score: 88,
                feedback: 'Case study demonstrates deep understanding of modern B2B SaaS acquisition economics and payback periods.'
            },
            interviewQuestions: [
                'How do you handle attribution when marketing channels have overlapping touchpoints before conversion?',
                'Can you walk through an A/B test you designed where the initial results were inconclusive and how you iterated?',
                'What metrics do you present to executive leadership to justify budget reallocation between paid and inbound channels?'
            ],
            evaluatedAt: '2026-11-21T09:15:00.000Z'
        },
        recruiterNotes: 'Excellent presentation and communication skills. Follow up on Tuesday for hiring manager review.',
        appliedAt: '2026-11-21T09:15:00.000Z'
    },
    'mock-3': {
        _id: 'mock-3',
        job: {
            _id: 'j3',
            title: 'Data Platform Engineer',
            companyName: 'DataGrid',
            department: 'Software & IT',
            evaluationType: 'TECHNICAL_GITHUB',
            requiredSkills: ['Python', 'SQL', 'PostgreSQL', 'Snowflake', 'Apache Spark', 'Docker']
        },
        candidate: {
            _id: 'c3',
            name: 'Darmant',
            email: 'darmant@example.com',
            phone: '+1 (555) 492-1823'
        },
        candidateProfile: {
            headline: 'Data Platform Architect',
            location: 'Austin, TX (Remote)',
            parsedSkills: ['Python', 'SQL', 'PostgreSQL', 'Airflow', 'Spark', 'dbt', 'BigQuery'],
            resumeFileName: 'Darmant_Data_Architect.pdf',
            githubUrl: 'https://github.com/darmant/lakehouse-pipeline'
        },
        status: 'SHORTLISTED',
        matchScore: 87,
        githubUrl: 'https://github.com/darmant/lakehouse-pipeline',
        aiEvaluation: {
            overallMatchScore: 87,
            resumeScore: 88,
            practicalScore: 86,
            summary: 'Experienced data engineer with robust Lakehouse architecture experience. Clean SQL transformations and automated pipeline orchestration verified via GitHub audit.',
            strengths: ['Airflow DAG modularity and idempotent task design', 'Deep relational SQL optimization and column-level lineage', 'Automated data freshness & anomaly alerting'],
            weaknesses: ['Moderate experience with streaming Kafka engines'],
            missingSkills: ['Streaming Kafka'],
            recommendations: ['Advance to technical architecture round with Principal Data Architect'],
            criteriaScores: [
                { criterion: 'Data Modeling & Pipeline Design', score: 27, weightage: 30, reasoning: 'Solid medallion architecture using dbt and modern Lakehouse standards.' },
                { criterion: 'SQL Optimization & Indexing', score: 26, weightage: 30, reasoning: 'Partition pruning and materialized views designed efficiently.' },
                { criterion: 'Orchestration & Testing', score: 18, weightage: 20, reasoning: 'Automated Great Expectations data test coverage.' },
                { criterion: 'Infrastructure & CI/CD', score: 16, weightage: 20, reasoning: 'Terraform and Docker integration for reproducible pipelines.' }
            ],
            githubAudit: {
                repoUrl: 'https://github.com/darmant/lakehouse-pipeline',
                technicalScore: 88,
                codeQualityScore: 22,
                architectureScore: 18,
                testingScore: 13,
                summary: 'Pipeline code passes syntax and lineage audits with high reliability scores.'
            },
            interviewQuestions: [
                'How do you enforce idempotency in Airflow DAGs when dealing with backfills?',
                'Explain how you would design partition pruning on a table with 500 million rows.'
            ],
            evaluatedAt: '2026-11-21T11:00:00.000Z'
        },
        appliedAt: '2026-11-21T11:00:00.000Z'
    },
    'mock-4': {
        _id: 'mock-4',
        job: {
            _id: 'j4',
            title: 'Technical Product Manager',
            companyName: 'Aero',
            department: 'Operations',
            evaluationType: 'CASE_STUDY',
            requiredSkills: ['Product Strategy', 'SQL', 'Agile Roadmapping', 'API Specifications', 'User Research']
        },
        candidate: {
            _id: 'c4',
            name: 'Ravatan',
            email: 'ravatan@example.com',
            phone: '+1 (555) 618-9321'
        },
        candidateProfile: {
            headline: 'Technical Product Manager',
            location: 'Seattle, WA (Hybrid)',
            parsedSkills: ['Product Strategy', 'SQL', 'Project Management', 'Jira', 'API Design', 'User Research'],
            resumeFileName: 'Ravatan_TPM_Resume.pdf'
        },
        status: 'APPLIED',
        matchScore: 87,
        assignmentSubmission: 'PRD: Automated Supply Chain Exception Handling Engine. Details functional requirements, edge-case routing, and developer-friendly webhook APIs.',
        aiEvaluation: {
            overallMatchScore: 87,
            resumeScore: 89,
            practicalScore: 85,
            summary: 'Exceptional technical PRD writing. Clear trade-off matrix balancing developer velocity against stakeholder requirements.',
            strengths: ['Crisp user stories and acceptance criteria', 'Strong technical understanding of REST APIs and data flow'],
            weaknesses: ['Could include more qualitative customer interview transcripts'],
            missingSkills: [],
            recommendations: ['Schedule initial product sense screening'],
            criteriaScores: [
                { criterion: 'Product Strategy & Vision', score: 26, weightage: 30, reasoning: 'Clear market opportunity framing and competitive differentiation.' },
                { criterion: 'Technical Execution & PRD', score: 27, weightage: 30, reasoning: 'Exhaustive edge-case definitions and data flow diagrams.' },
                { criterion: 'Stakeholder Alignment', score: 17, weightage: 20, reasoning: 'Well-structured release sequencing and milestone gates.' },
                { criterion: 'Metrics & Experimentation', score: 17, weightage: 20, reasoning: 'Defined North Star metrics and leading indicators.' }
            ],
            interviewQuestions: [
                'How do you prioritize tech debt versus revenue-generating product features?',
                'Walk through a time you had to say no to an executive feature request.'
            ],
            evaluatedAt: '2026-11-21T13:45:00.000Z'
        },
        appliedAt: '2026-11-21T13:45:00.000Z'
    },
    'mock-5': {
        _id: 'mock-5',
        job: {
            _id: 'j5',
            title: 'Marketing Operations',
            companyName: 'Omni Media',
            department: 'Marketing',
            evaluationType: 'CASE_STUDY',
            requiredSkills: ['Marketing Automation', 'HubSpot', 'Salesforce', 'SQL', 'Campaign Ops']
        },
        candidate: {
            _id: 'c5',
            name: 'Jinia',
            email: 'jinia@example.com',
            phone: '+1 (555) 843-1940'
        },
        candidateProfile: {
            headline: 'Marketing Ops Lead',
            location: 'Chicago, IL (Remote)',
            parsedSkills: ['Python', 'SQL', 'Project Management', 'HubSpot', 'Salesforce', 'Zapier', 'Lifecycle Marketing'],
            resumeFileName: 'Jinia_MarketingOps.pdf'
        },
        status: 'SCREENING',
        matchScore: 87,
        assignmentSubmission: 'Campaign Lifecycle Orchestration: Automated lead enrichment workflow with scoring thresholds routing qualified MQLs into Salesforce within 3 minutes.',
        aiEvaluation: {
            overallMatchScore: 87,
            resumeScore: 86,
            practicalScore: 88,
            summary: 'Specialized expertise in CRM data synchronization and inbound lead routing logic. Demonstrated high attention to detail in lifecycle staging.',
            strengths: ['Clean CRM schema hygiene', 'Speed-to-lead automation reducing latency by 75%'],
            weaknesses: ['Limited custom Python scripting for bespoke integrations'],
            missingSkills: ['Advanced Python Scripting'],
            recommendations: ['Advance to hiring manager interview with VP of Marketing'],
            criteriaScores: [
                { criterion: 'CRM & Automation Architecture', score: 27, weightage: 30, reasoning: 'Robust routing rules with error notification channels.' },
                { criterion: 'Data Hygiene & Analytics', score: 26, weightage: 30, reasoning: 'Deduplication rules and standardized field mapping.' },
                { criterion: 'Lifecycle Campaign Design', score: 18, weightage: 20, reasoning: 'Thoughtful nurture sequences aligned with buying stages.' },
                { criterion: 'Execution Speed & Reliability', score: 16, weightage: 20, reasoning: 'Failover mechanisms for webhook timeouts.' }
            ],
            interviewQuestions: [
                'How do you debug sync failures between HubSpot and Salesforce?',
                'What is your methodology for building an objective lead scoring model?'
            ],
            evaluatedAt: '2026-11-21T14:20:00.000Z'
        },
        appliedAt: '2026-11-21T14:20:00.000Z'
    },
    'mock-6': {
        _id: 'mock-6',
        job: {
            _id: 'j6',
            title: 'Full Stack Engineer',
            companyName: 'NextFlow',
            department: 'Software & IT',
            evaluationType: 'TECHNICAL_GITHUB',
            requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'TailwindCSS', 'GraphQL']
        },
        candidate: {
            _id: 'c6',
            name: 'Salian',
            email: 'salian@example.com',
            phone: '+1 (555) 234-9018'
        },
        candidateProfile: {
            headline: 'Full Stack Developer',
            location: 'Boston, MA (Hybrid)',
            parsedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'TailwindCSS', 'Next.js'],
            resumeFileName: 'Salian_FullStack.pdf',
            githubUrl: 'https://github.com/salian/saas-dashboard'
        },
        status: 'SHORTLISTED',
        matchScore: 87,
        githubUrl: 'https://github.com/salian/saas-dashboard',
        aiEvaluation: {
            overallMatchScore: 87,
            resumeScore: 86,
            practicalScore: 88,
            summary: 'Solid full-stack engineering practices. Clean React component boundaries, responsive Tailwind styling, and resilient API route validation.',
            strengths: ['Modern Next.js App Router utilization', 'Strict TypeScript interfaces across client and server boundaries'],
            weaknesses: ['Could expand end-to-end Playwright test coverage'],
            missingSkills: ['E2E Testing (Playwright)'],
            recommendations: ['Move to collaborative coding exercise'],
            criteriaScores: [
                { criterion: 'Frontend Architecture & UI', score: 27, weightage: 30, reasoning: 'Modular component hierarchy with zero layout shift.' },
                { criterion: 'Backend API & Database', score: 26, weightage: 30, reasoning: 'Clean ORM schema and relational foreign key constraints.' },
                { criterion: 'Type Safety & Code Rigor', score: 18, weightage: 20, reasoning: 'Strict TypeScript configuration with zero any types.' },
                { criterion: 'Performance & Optimization', score: 16, weightage: 20, reasoning: 'Effective caching and server component streaming.' }
            ],
            githubAudit: {
                repoUrl: 'https://github.com/salian/saas-dashboard',
                technicalScore: 89,
                codeQualityScore: 23,
                architectureScore: 18,
                testingScore: 13,
                summary: 'Frontend and backend source files pass ESLint and TypeScript compilation with zero errors.'
            },
            interviewQuestions: [
                'Explain how you prevent unnecessary re-renders in deeply nested React component trees.',
                'How do you manage server state versus local UI state in modern Next.js applications?'
            ],
            evaluatedAt: '2026-11-21T15:10:00.000Z'
        },
        appliedAt: '2026-11-21T15:10:00.000Z'
    },
    'mock-7': {
        _id: 'mock-7',
        job: {
            _id: 'j7',
            title: 'B2B Sales Executive',
            companyName: 'SaaSify',
            department: 'Sales & BD',
            evaluationType: 'CASE_STUDY',
            requiredSkills: ['Enterprise Sales', 'Negotiation', 'CRM', 'MEDDPICC', 'Discovery Calls']
        },
        candidate: {
            _id: 'c7',
            name: 'Sarah B.',
            email: 'sarah.b@example.com',
            phone: '+1 (555) 678-2940'
        },
        candidateProfile: {
            headline: 'Enterprise Account Executive',
            location: 'Denver, CO (Remote)',
            parsedSkills: ['Enterprise Sales', 'Negotiation', 'CRM', 'Salesforce', 'Outreach', 'Pipeline Forecasting'],
            resumeFileName: 'SarahB_Sales_Resume.pdf'
        },
        status: 'SCREENING',
        matchScore: 87,
        assignmentSubmission: 'Enterprise Discovery Framework: Detailed 6-stage MEDDPICC discovery plan targeting Fortune 500 CIOs with ROI calculation sheet.',
        aiEvaluation: {
            overallMatchScore: 87,
            resumeScore: 88,
            practicalScore: 86,
            summary: 'Experienced B2B sales closer with verified track record in enterprise contract negotiations ($100k+ ARR deals).',
            strengths: ['Rigorous qualification methodology using MEDDPICC', 'Value-driven presentation style with quantifiable ROI models'],
            weaknesses: ['Limited experience in consumption-based pricing models'],
            missingSkills: ['Consumption-based pricing models'],
            recommendations: ['Schedule sales role-play simulation with VP of Sales'],
            criteriaScores: [
                { criterion: 'Enterprise Deal Strategy', score: 26, weightage: 30, reasoning: 'Clear identification of Economic Buyer and Decision Criteria.' },
                { criterion: 'Discovery & Pain Uncovering', score: 27, weightage: 30, reasoning: 'Insightful open-ended questioning uncover genuine business bottlenecks.' },
                { criterion: 'Objection Handling & Closing', score: 17, weightage: 20, reasoning: 'Pragmatic commercial negotiation and discount boundaries.' },
                { criterion: 'Pipeline Rigor & Forecasting', score: 17, weightage: 20, reasoning: 'Disciplined CRM tracking and realistic close dates.' }
            ],
            interviewQuestions: [
                'Walk through the most complex multi-stakeholder deal you closed and how you built internal champions.',
                'How do you handle a prospect when their primary objection is budget freeze?'
            ],
            evaluatedAt: '2026-11-21T16:00:00.000Z'
        },
        appliedAt: '2026-11-21T16:00:00.000Z'
    },
    'mock-8': {
        _id: 'mock-8',
        job: {
            _id: 'j8',
            title: 'Systems Architect',
            companyName: 'CloudScale Systems',
            department: 'Software & IT',
            evaluationType: 'TECHNICAL_GITHUB',
            requiredSkills: ['Kubernetes', 'Go', 'Distributed Systems', 'Terraform', 'Observability', 'Linux']
        },
        candidate: {
            _id: 'c8',
            name: 'Banzna',
            email: 'banzna@example.com',
            phone: '+1 (555) 912-4530'
        },
        candidateProfile: {
            headline: 'Systems & Infrastructure Lead',
            location: 'San Jose, CA (Hybrid)',
            parsedSkills: ['Kubernetes', 'Go', 'Distributed Systems', 'Terraform', 'Prometheus', 'AWS', 'Linux'],
            resumeFileName: 'Banzna_Systems_Architect.pdf',
            githubUrl: 'https://github.com/banzna/k8s-mesh-operator'
        },
        status: 'SHORTLISTED',
        matchScore: 87,
        githubUrl: 'https://github.com/banzna/k8s-mesh-operator',
        aiEvaluation: {
            overallMatchScore: 87,
            resumeScore: 89,
            practicalScore: 85,
            summary: 'Deep expertise in Kubernetes operator pattern, Go concurrency, and declarative infrastructure automation.',
            strengths: ['Idiomatic Go code with robust channel synchronization', 'Production-ready Helm charts and Prometheus metrics'],
            weaknesses: ['Could document multi-cluster service mesh failover scenarios more deeply'],
            missingSkills: [],
            recommendations: ['Advance to technical architecture review with CTO'],
            criteriaScores: [
                { criterion: 'Infrastructure & Kubernetes Architecture', score: 27, weightage: 30, reasoning: 'Solid custom resource definition (CRD) controller loops.' },
                { criterion: 'Code Quality & Concurrency in Go', score: 26, weightage: 30, reasoning: 'Proper context propagation and goroutine leak prevention.' },
                { criterion: 'Reliability, SRE & Observability', score: 17, weightage: 20, reasoning: 'Comprehensive golden signal metrics and structured logging.' },
                { criterion: 'Security & Access Control', score: 17, weightage: 20, reasoning: 'Least-privilege RBAC roles and container image scanning.' }
            ],
            githubAudit: {
                repoUrl: 'https://github.com/banzna/k8s-mesh-operator',
                technicalScore: 90,
                codeQualityScore: 23,
                architectureScore: 19,
                testingScore: 14,
                summary: 'Kubernetes controller source passes static security analysis and unit tests.'
            },
            interviewQuestions: [
                'Explain how you manage state reconciliation loops in Kubernetes operators without causing API server stampedes.',
                'How do you design zero-downtime rolling upgrades across stateful distributed databases?'
            ],
            evaluatedAt: '2026-11-21T16:45:00.000Z'
        },
        appliedAt: '2026-11-21T16:45:00.000Z'
    }
};

// In-memory store for mutations during session
const runtimeMockStore: Record<string, IMockCandidateApplication> = { ...INITIAL_MOCK_APPLICATIONS };

export function getMockCandidateById(id: string): IMockCandidateApplication | null {
    if (runtimeMockStore[id]) {
        return runtimeMockStore[id];
    }

    // If ID matches a generic pattern like mock-X, generate a coherent record
    const match = id.match(/mock-(\d+)/);
    const index = match ? parseInt(match[1], 10) : 1;
    const fallbackKey = `mock-${((index - 1) % 8) + 1}`;
    const template = INITIAL_MOCK_APPLICATIONS[fallbackKey] || INITIAL_MOCK_APPLICATIONS['mock-1'];

    const generated: IMockCandidateApplication = {
        ...template,
        _id: id,
        candidate: {
            ...template.candidate,
            _id: `c-${id}`,
            name: `${template.candidate.name} (${id})`,
            email: `${template.candidate.name.toLowerCase().replace(/[^a-z]/g, '')}_${id}@example.com`
        }
    };

    runtimeMockStore[id] = generated;
    return generated;
}

export function updateMockCandidate(id: string, updates: Partial<IMockCandidateApplication>): IMockCandidateApplication {
    const existing = getMockCandidateById(id) || INITIAL_MOCK_APPLICATIONS['mock-1'];
    const updated: IMockCandidateApplication = {
        ...existing,
        ...updates,
        _id: id
    };
    runtimeMockStore[id] = updated;
    return updated;
}
