## FEATURE:

 A fully private, in-house AI system for a mid-sized law firm, powered by LLaMA 3 70B and hosted on dual A100 GPUs via CoreWeave. Useing ChromaDB and LlamaIndex to enable real-time Q&A and document summarization over legal files, all without exposing any data to third-party APIs. The system is automated using n8n to handle everything from document ingestion and processing to Slack/email routing and compliance logging. Staff interact with the AI through a secure, JWT-authenticated React UI that allows them to ask questions, upload files, chat, and receive instant summaries—all within a legally compliant, cost-effective, and scalable setup that saves dozens of hours per week.

1. **Tech Stack**

-Foundation Model
LLaMA 3 70B (Meta’s large language model)
Quantized and accelerated with vLLM for faster inference and reduced GPU costs.

-User Interface
Built with React to deliver a responsive, intuitive, and dynamic front-end experience tailored for legal workflows.

-Hosting / Compute
Privately hosted on CoreWeave, a cloud GPU provider specialized in high-performance computing.
Runs on dual NVIDIA A100 GPUs, delivering enterprise-grade processing power for low-latency responses.

-Data Storage & Retrieval
Uses ChromaDB, a vector database optimized for storing document embeddings.
Stores law firm documents (case files, contracts, filings) in vectorized form to facilitate efficient retrieval.

-RAG (Retrieval-Augmented Generation) Pipeline
Powered by LlamaIndex, enabling real-time, context-aware Q&A over the firm’s internal legal documents.

-Automation Layer
Built on n8n, an open-source workflow automation tool acting as the integration glue.
Automates monitoring of new documents, chunking and embedding into ChromaDB, triggering LLM summarization and Q&A workflows, routing insights to staff via Slack or email, and maintaining activity logs for compliance.

-Security & Compliance
JWT authentication to ensure secure and controlled access.
IP access controls restrict connections to authorized networks only.
Full audit logging to support compliance requirements and facilitate future audits.

2. **Secure Authentication System**

- Enterprise-grade login with username/password
- JWT-based token authentication with auto-refresh
- Session timeout + soft re-authentication
- IP-based allowlist (configured per deployment)
- Rate limiting to prevent brute force attacks
- “Remember Me” (optional) with configurable expiry


3. **Real-Time AI Chat Interface**

- Persistent chat threads per document or general topic
- Real-time AI typing indicators with smooth animation
- Message confidence scores and source references
- Streaming responses via WebSocket (AI “thinking” effect)
- Natural grouping of message bubbles by time/context
- Message-level actions: copy, bookmark, delete, export

4. **Document Upload & Processing**

- Drag-and-drop upload with file validation (PDF, DOCX, TXT)
- Visual feedback on upload and processing steps:
    - Uploading → Extracting → Embedding → Ready
- OCR fallback for scanned PDFs (with status shown to user)
- Live progress bar and cancel option
- Page-level thumbnail preview for uploaded documents

5. **Document-Aware Chat with Source Attribution**

- AI can answer questions using uploaded documents
- Each answer includes:
    - Confidence score
    - Page number references
    - Expandable excerpts
- Multi-document support (user can switch context or start new chat per document)

6. **Chat History & Session Management**

- All chats are saved under sessions (named after docs or topics)
- Timestamped message history per session
- Filter/search messages within a session
- Export session (PDF, text, JSON)
- Confidence and source indicators remain visible in export

7. **Document Library**

- Grid/List view toggle
- Filter by document name, type, date, status
- Actions: Download, Rename, Delete
- Status tags: Uploading, Processing, Ready, Failed
- Usage stats: Last accessed, # questions asked
- Search + pagination

8. **User Roles & Permissions**

- **Standard User**
    - Can upload docs, chat, manage profile, access personal library
- **Admin User**
    - Full visibility into all user activity
    - User creation, deactivation, editing
    - Security monitoring: login attempts, audit trail, IP blocks
    - System-level settings: feature toggles, rate limits
    - ROI dashboard for analytics (usage, query load, etc.)

9. **Admin Dashboard**

- Analytics for usage: # uploads, # chats, avg confidence
- Logs of user activity by IP, time, and action
- Exportable audit log (CSV, JSON)
- View document processing pipeline health
- Toggle system features (e.g., enable dark mode globally)

**Target UI/UX Breakdown**

1.Login Page

- Minimalist, legal-themed login page with company branding
- Central card with form, dark/light support
- Clean CTA buttons with loading states
- Error states for wrong credentials, disabled accounts
- Enterprise security note with lock icon
- Optional “Forgot Password” (link configurable)

2.Chat UX Features:

- Scrollable chat window with infinite scroll
- Assistant responses animated with streaming effect
- Messages use colored borders (e.g., green = high confidence)
- Upload docs directly from chat window (📎 icon)
- Toast notifications for processing completion, errors, etc.
- Realtime AI typing indicator (animated dots + "AI is thinking...")
- Highlighted keywords when sources are shown

3.Document Upload UX:

- Drag-and-drop zone with hover animation
- Auto-detect file type and validate size
- Modal overlay progress:
    - ✔️ Uploaded
    - 🔄 Processing
    - 🔍 OCR in progress (if needed)
    - ✅ Ready to chat
- Inline error cards for unsupported files or virus scan fail
- Document preview: thumbnails + scroll

4.Responsive Behavior:

- Fully responsive down to mobile view
- On mobile:
    - Sidebar collapses into hamburger menu
    - Chat and doc view stack vertically
    - Modals and toasts adjust to screen width


5.Visual & Branding Guidelines:

- Legal-professional color palette: navy, slate, white, green accents
- Clean, modern typography (Inter, Roboto, etc.)
- Animated transitions (Framer Motion): slide in/out, fade, pulse
- Subtle branded footer with client firm name/logo
- All icons use a consistent library (Lucide, Heroicons, etc.)

---

6.Accessibility:

- Focusable elements via keyboard
- High-contrast mode (toggle via profile/settings)
- Screen reader-friendly inputs and buttons
- Descriptive `aria-labels` for complex elements (chat, document cards)
- Reduced motion setting supported globally

## EXAMPLES:

- `examples/1auth.py` - Implements the JWT authentication system including login, token generation, and user management logic. This is critical because the React app needs to integrate with this exact authentication flow for user sessions and protected routes.

- `examples/1database.py` - Contains the SQLModel database schemas that define the data structures and relationships throughout the system. This is vital because the React frontend needs to understand the exact data models to properly handle API responses and form submissions.

- `examples/1production_main.py` - This is the FastAPI backend server that defines all REST API endpoints - it's crucial because the React frontend will consume these exact endpoints. Understanding the API structure, authentication middleware, and response formats here is essential for building the React client.

- `examples/1settings.py` - Defines all configuration settings using Pydantic, including security keys, database URLs, and API endpoints. This is important because it shows how the system is configured and what environment variables the React app might need to coordinate with the backend.

## DOCUMENTATION:

During development, reference the following resources and specifications:

External Resources:

Next.js Documentation

React Query Docs

Tailwind CSS Docs

[Mantine or Shadcn/ui Docs](https://ui.shadcn.dev/docs
 / https://mantine.dev/docs/
)

Zod Schema Docs

React Hook Form Docs

Framer Motion Docs

JWT Auth in FastAPI

WebSocket Support in FastAPI

## OTHER CONSIDERATIONS:

#Security & Compliance

Token handling must avoid localStorage/sessionStorage — use secure httpOnly cookies only.

Ensure secure file handling — scanned PDFs must be virus scanned before processing or embedding.

IP allowlisting must be configurable via environment or admin settings.

#State Management Pitfalls

When using Zustand, avoid leaking state between server/client. SSR hydration issues may occur. Use useEffect gates or Next.js middleware accordingly.

Persisted chat state: Watch for hydration mismatch on first load due to dynamic content and SSR.

#AI Chat Integration

Clearly separate general chat vs. document-specific context chats. Each should have its own namespace or state ID.

Source attribution must match DocumentSource shape exactly and allow click-to-expand inline.

#File Upload Edge Cases

Handle file size limits and format validation on the client before sending to the backend.

Provide fallbacks for documents with no extractable text (OCR fallback or error notice).

Don't assume every page will return useful embeddings — embed status should be shown in UI.

#Performance Bottlenecks

Avoid re-rendering entire chat on every new message — use memoization or virtualization for message lists.

Batch API requests when loading multiple document statuses or analytics data.

#Testing & CI

Set up mocks for WebSocket in testing environments.

Include accessibility testing in CI to prevent regressions.

Ensure test data doesn't leak into production if using shared staging databases.

#Accessibility

Test document views and chats with screen readers.

Ensure upload zones are keyboard-navigable and include ARIA roles.