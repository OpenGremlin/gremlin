  
**GREMLIN**

Personal Living Room AI Agent Display

System Design Document

Version 1.0  |  February 2026

**DRAFT — Ready for Implementation**

Phone: React Native (Android \+ iOS) • Screen: Fire TV • webOS • Web Browser

*Roku support planned for future release*

# **1\. Executive Summary**

Gremlin is a personal living room AI agent system that transforms a television into an intelligent, dynamic dashboard controlled from a smartphone. It combines an always-on ambient display (weather, calendar, news, traffic) with on-demand agentic capabilities (web search, media playback, task automation) orchestrated by an AI agent running on a local server.

The system consists of three components: a phone app (command input and permission management), a local server (AI orchestrator and agent runtime), and a TV screen app (dynamic module renderer). Communication between all components is real-time via WebSocket connections.

## **1.1 Core Value Proposition**

Gremlin is like Alexa, but with a visual canvas. Where Alexa tells you the weather, Gremlin shows you the weather alongside your commute time, your first meeting, and a news summary—all at once. Where Alexa requires you to remember what to ask, Gremlin proactively surfaces relevant information. The TV screen provides persistent, glanceable, shared visibility that a phone or voice-only assistant cannot.

## **1.2 Two-Layer Architecture**

* **Layer 1 — Smart Ambient Display:** Always on, zero input required. Weather, traffic, calendar, email digest, news headlines, photo slideshow. This layer alone justifies the screen being on. It is essentially MagicMirror but with AI-generated summaries instead of raw data feeds.

* **Layer 2 — Agentic On-Demand:** Phone or voice triggered. Users issue commands like “dig into that news story,” “play something relaxing,” or “what’s on my schedule this afternoon.” These commands dynamically spawn or modify modules on top of the ambient layer.

Layer 1 earns the screen’s place in the room. Layer 2 is what differentiates it from a static dashboard.

## **1.3 Design Tenets**

**Safe by default.** The system never takes destructive or irreversible actions without explicit approval. Read-only operations are auto-approved; anything that writes, sends, deletes, or spends requires permission. It is better to ask unnecessarily than to cause harm.

**Usable by anyone.** If a non-technical family member cannot use it, it is too complicated. No terminal commands, no config files, no IP addresses visible to end users. Setup and daily use should require zero technical knowledge.

**Ambient first, agentic second.** The screen is useful the moment it turns on with zero input. If the LLM API is down or agents crash, the ambient dashboard still works. The system degrades gracefully—it is never a blank screen or an error message on the living room TV.

**Privacy is structural, not behavioral.** The system does not rely on the AI to judge what is sensitive. The profile system is a hard boundary—Family mode lacks access to personal data sources. You cannot leak what you cannot access.

**Local-first.** The server runs in the home, on the local network. Personal data does not leave the network except for explicit external API calls (LLM, weather, email). There is no cloud service, no third-party account, no subscription. The user owns the hardware and the data.

## **1.4 Target Platforms**

| Component | Platform | Technology |
| :---- | :---- | :---- |
| Phone App | Android and iOS | React Native |
| Screen Client | Fire TV | Android WebView wrapper (sideloaded APK) |
| Screen Client | LG webOS | webOS web app (hosted) |
| Screen Client | Web Browser | React app in Chromium kiosk mode |
| Server | Local PC / Mini PC | Node.js / TypeScript |

Roku support is deferred to a future release due to its more restrictive app platform.

# **2\. System Architecture**

## **2.1 High-Level Overview**

The system follows a hub-and-spoke model. The server is the hub. The phone and screen are both WebSocket clients. All intelligence, state management, and agent orchestration live on the server. The phone and screen are intentionally thin—the phone is an input/approval surface, and the screen is a dumb renderer.

\+-----------------------------------------------+  
|                  PHONE APP                     |  
|  \+-------------+  \+------------------------+  |  
|  | Voice/Text  |  | Approval/Permission    |  |  
|  |   Input     |  |       Feed             |  |  
|  \+------+------+  \+-----------^------------+  |  
|         |                     |                |  
\+---------+---------------------+----------------+  
          | WebSocket           | WebSocket         
          v                     |                   
\+-----------------------------------------------+  
|              SERVER (Local PC)                 |  
|                                                |  
|  \+-----------------------------------------+  |  
|  |         ORCHESTRATOR AGENT               |  |  
|  |  \- Command parsing & intent routing      |  |  
|  |  \- Layout manager (mode-based)           |  |  
|  |  \- Permission broker                     |  |  
|  |  \- Job scheduler                         |  |  
|  \+----+----------+----------+--------------+  |  
|       |          |          |                  |  
|  \+----v---+ \+----v----+ \+---v------+          |  
|  | Web    | | Media   | | Data     |  ...     |  
|  | Search | | Agent   | | Agent    |          |  
|  | Agent  | | (YT/SP) | | (charts) |          |  
|  \+----+---+ \+----+----+ \+---+------+          |  
|       |          |          |                  |  
|  \+----v----------v----------v--------------+  |  
|  |         MODULE STATE STORE               |  |  
|  \+-----------------+-----------------------+  |  
\+--------------------+------------------------+  
                     | WebSocket                 
                     v                           
\+-----------------------------------------------+  
|              SCREEN APP (TV)                   |  
|                                                |  
|  \+----------+ \+----------+ \+----------+       |  
|  | Module A | | Module B | | Module C |       |  
|  | (Video)  | | (Chart)  | | (Tasks)  |       |  
|  \+----------+ \+----------+ \+----------+       |  
\+-----------------------------------------------+

## **2.2 Server Architecture**

The server is a Node.js/TypeScript application with the following subsystems:

**Orchestrator Agent**

The central intelligence. Receives natural language commands from the phone, classifies intent, decides if a sub-agent is needed, decides if screen real estate is required, and manages the permission flow. The orchestrator maintains a task registry of all active task instances and their states. It is the only component that talks to the layout manager.

**Sub-Agents**

Specialist agents that receive scoped tasks from the orchestrator. Each agent performs its work and returns structured output including both a result (data) and a render hint (how it should appear on screen). Examples include:

* Web Search Agent — searches the web, summarizes results, identifies relevant media

* Media Agent — finds and plays YouTube videos, Spotify tracks, podcasts

* Data Agent — generates charts, visualizations, data summaries

* Email Agent — reads and summarizes email (requires permission)

* Calendar Agent — reads and displays calendar events

* News Agent — fetches, curates, and summarizes news by topic

**Layout Manager**

A subsystem that manages the screen’s display state. It does not do pixel-level positioning. Instead, it expresses layout in terms of modes (idle, focus, split, fullscreen) and assigns modules to predefined slots. The layout state is a JSON document broadcast to the screen app via WebSocket whenever it changes.

**Permission Broker**

Manages the permission lifecycle. When a sub-agent needs access to a protected resource (email, calendar, messaging), the broker checks the user’s permission settings. If approval is needed, it sends a request to the phone and pauses the task until a response is received.

**Job Scheduler**

A simple cron-style scheduler for recurring tasks. Jobs are configured via the phone app and stored on the server. When a job fires, it submits a command to the orchestrator as if it came from the phone. Uses a library like node-cron or bull.

**Module State Store**

The central source of truth for what is currently on screen. Each module has an ID, a type, a position/slot, a lifecycle state, and the data it is rendering. The screen app subscribes to this store and reactively renders. State is held in memory and optionally persisted to disk as JSON for restore on reboot.

## **2.3 Orchestration Strategy**

The orchestrator is an LLM-powered agent that uses tool-use (function calling) to route commands, manage sub-agents, and control the screen. It is not a rule-based router or keyword matcher. It uses the LLM’s reasoning to interpret ambiguous commands, decide on multi-step plans, and determine how results should appear on screen.

**How the Orchestrator Works**

When a command arrives from the phone, the orchestrator receives it as a message along with context: the active profile, the current screen state (what modules are showing), the list of available sub-agents, and the conversation history for multi-turn interactions. The LLM processes this context and decides what to do by calling tools.

The orchestrator has access to the following tool categories:

* **Agent dispatch tools:** Functions like dispatch\_web\_search(query), dispatch\_media\_search(query, type), dispatch\_email\_summary(), dispatch\_news\_report(topic). Each dispatches a task to the corresponding sub-agent and returns structured results.

* **Layout tools:** Functions like set\_layout\_mode(mode), create\_module(type, data, priority), dismiss\_module(moduleId), update\_module(moduleId, data). These control what appears on the TV screen.

* **Permission tools:** Functions like request\_permission(resource, reason) which pauses execution and sends an approval request to the phone. The orchestrator resumes when the user responds.

* **Clarification tools:** Functions like ask\_user(question, options) which sends a question to the phone and waits for a response before continuing.

* **Avatar tools:** Functions like set\_avatar\_state(state, message) to control the avatar’s visual state and optional speech.

**Example: Simple Command**

User says: “Find me the latest on semiconductor tariffs.”

The orchestrator receives this command, reasons that it needs web search, and calls dispatch\_web\_search("semiconductor tariffs latest news"). The web search agent runs, finds articles and a relevant YouTube video, and returns structured results with render hints. The orchestrator then calls create\_module("news-card", results, "high") and set\_layout\_mode("focus"). The screen transitions from idle to focus mode with the news card as the main stage module.

**Example: Multi-Step Command**

User says: “Help me plan a weekend trip to the Catskills.”

The orchestrator recognizes this as a multi-step task. It might first call dispatch\_web\_search("Catskills weekend trip activities") to gather options, then create\_module("task-checklist", { steps: \["Find activities", "Check weather", "Find lodging"\] }, "high") to show progress on screen. As each sub-task completes, it calls update\_module() to update the checklist and may create additional modules (a weather widget for the Catskills area, a map of lodging options). The user sees the task unfold progressively on the TV.

**Example: Permission-Gated Command**

User says: “Summarize my unread emails.”

The orchestrator calls dispatch\_email\_summary(). The email agent checks with the permission broker, which sees that email access is set to “Ask Once Per Session” and has not been granted yet. The broker calls request\_permission("email\_read", "Summarize unread emails"), which sends an approval card to the phone. The avatar transitions to the “waiting” state (orange pulse). When the user approves on the phone, the email agent proceeds, and the orchestrator creates a summarized email digest module on screen.

**Orchestrator System Prompt**

The orchestrator’s behavior is defined by a system prompt that establishes its role, constraints, and decision-making guidelines. Key elements of this prompt include:

* You are the orchestrator for a living room AI display system. Your job is to interpret user commands, delegate to sub-agents, and manage what appears on the TV screen.

* Always check the active profile before accessing personal data. If the Family profile is active, do not access personal email, calendars, or other individual data sources.

* Prefer showing results on screen over just acknowledging a command. If a task produces output, create a module for it.

* For multi-step tasks, show a checklist module so the user can see progress.

* When unsure what the user wants, use the ask\_user tool to clarify rather than guessing.

* Never take destructive actions (send, delete, purchase) without explicit permission, even if the user’s tone implies urgency.

* Consider the current screen state before adding modules. If the screen is already in focus mode, decide whether the new result should replace the current focus or go into split mode.

**Conversation Context**

The orchestrator maintains a short conversation history per session so it can handle follow-up commands. If the user says “Find me news about tariffs” and then says “Play one of those videos,” the orchestrator has context from the previous command to know which videos the user is referring to. This history is scoped per-profile and resets when the profile deactivates or after a configurable timeout.

**Sub-Agent Independence**

Sub-agents are not conversational. They receive a structured task (search query, email account, chart data request), execute it using their own tools (web APIs, email APIs, data processing), and return structured results. They do not have access to the orchestrator’s conversation history or the screen state. This keeps sub-agents simple, testable, and swappable. The orchestrator is the only component that reasons about the full system context.

# **3\. Screen Layout System**

## **3.1 Design Principles**

The screen is a 10-foot UI viewed from a couch. This means large text, high contrast, no fine-grained layout distinctions, and smooth transitions. The layout system uses predefined modes rather than a free-form grid. The orchestrator agent expresses layout intent (this module is high priority, these two modules should be visible simultaneously) and the layout engine maps that intent to a mode.

## **3.2 Layout Modes**

**Idle Mode**

The default state when no foreground tasks are active. The full screen is an ambient dashboard with fixed module positions. Users develop spatial memory (weather is top right, calendar is left, email digest is bottom), so ambient modules must maintain stable positions across sessions.

\+-------------------+-------------------+  
| Calendar & Tasks  |  Weather & Clock  |  
|                   |                   |  
\+-------------------+-------------------+  
|                                       |  
|          News Headlines /              |  
|          Photo Slideshow               |  
|                                       |  
\+-------------------+-------------------+  
| Email Digest      |  Traffic / Commute|  
\+-------------------+-------------------+  
        \[avatar: dormant glow\]           

Note: In Family mode, the Email Digest slot shows shared notifications (e.g., school alerts, package deliveries) rather than personal email. When an individual profile is active, this slot shows that person’s personal email digest with AI-generated summaries.

**Focus Mode**

One foreground module takes 60–70% of the screen. Ambient modules compress into a sidebar. This is the most common active state—triggered by a single command like “find me news about X” or “play this video.”

\+---------------------------------+----------+  
|                                 | Weather  |  
|                                 | Calendar |  
|      MAIN STAGE                 |          |  
|      (focus module)             | \-------- |  
|                                 | Activity |  
|                                 |  Status  |  
|                                 |          |  
\+---------------------------------+----------+

**Split Mode**

Two foreground modules side by side. Used when the orchestrator determines two related results should be visible simultaneously (e.g., a news summary on the left, related video on the right). Ambient modules shrink further or disappear.

**Fullscreen Mode**

One module takes the entire screen. Used for immersive content like watching a video or viewing a large chart. All ambient modules are hidden. The avatar remains as a small overlay.

## **3.3 Module Types**

| Module Type | Description | Typical Mode |
| :---- | :---- | :---- |
| Video Player | YouTube embed via iframe API, lightweight | Focus / Fullscreen |
| News Card | Headline, summary, source attribution, optional image | Focus / Split |
| Chart | Data visualization (Chart.js or D3) | Focus / Split |
| Image Gallery | Photo grid or slideshow | Focus / Fullscreen |
| Spotify Player | Spotify embed or Web Playback SDK | Focus (compact) |
| Task Checklist | Multi-step task progress display | Focus sidebar |
| Weather Widget | Current conditions, forecast | Ambient |
| Calendar Widget | Today's schedule, upcoming events | Ambient |
| Email Digest | Summarized unread emails (AI-generated) | Ambient |
| News Ticker | Rotating headline bar | Ambient |
| Traffic Widget | Commute time and route conditions | Ambient |
| Clock | Current time and date | Ambient |

## **3.4 Module Lifecycle**

Every module follows a defined lifecycle: spawned (created by orchestrator), loading (agent working), active (displaying content), minimized (compressed in sidebar), completed (task done, can be dismissed), and dismissed (removed from screen). The orchestrator manages transitions. Users can control lifecycle from the phone (pin, dismiss, expand, minimize).

## **3.5 Transitions and Animation**

On a TV, abrupt layout changes are jarring. All mode transitions must be animated. A video module slides in from the right while ambient modules smoothly compress. A dismissed module fades out and the ambient layout reclaims space with a gentle expansion. CSS transitions handle this, but the screen app must be designed for animated layout changes from the start.

## **3.6 Ambient vs. Foreground Modules**

Ambient modules are persistent, low-priority, and auto-updating (weather refreshes every 30 minutes, email digest every 15 minutes). Foreground modules are spawned by user commands or scheduled jobs, get prime screen real estate, and push ambient modules to the edges. When a foreground module is dismissed, the ambient layout reclaims the space. The orchestrator treats these as fundamentally different categories.

# **4\. Avatar System**

## **4.1 Concept**

The avatar is a persistent visual anchor for the AI—a soft, abstract, non-human presence on screen that signals the system is alive and intelligent. It serves as a status indicator with personality rather than an assistant with a face. Think of it as a campfire in the corner of the room: always there, but sometimes embers and sometimes flaring up.

The avatar is a fluffy, abstract shape (a soft glowing orb or cloud-like form)—friendly, non-gendered, and abstract enough to avoid creating expectations of human-level social interaction. The aesthetic should evoke the Pixar lamp (Luxo Jr.): just enough physicality to feel alive.

## **4.2 Avatar States**

| State | Visual | Trigger | Behavior |
| :---- | :---- | :---- | :---- |
| Dormant | Small, barely animated dot/glow in corner. Very slow breathing pulse. | Idle mode, no activity | Near-invisible. Present if you look for it, but doesn’t compete with content. |
| Attentive | Perks up, gets slightly larger, animates more actively. | User is typing or speaking from phone | Visual feedback that input was received. Stays in this state during conversation. |
| Active | Expands, may move near relevant module. Delivers message via text overlay or voice. | System has something to say or show. | For high-priority: more animated. For routine: brief pulse. |
| Waiting | Gentle pulsing in distinct color (e.g., orange). Signals “check your phone.” | Permission request sent to phone | Creates visual language bridging TV and phone. |

## **4.3 Voice and Notifications**

The avatar can speak, but the bar for speaking should be high. The system should reserve voice output for things that are actionable, surprising, or require attention. Examples:

* **Worth speaking:** “I’ve ordered flowers for your wife.” High-value, action taken on behalf of user.

* **Subtle pulse only:** “Task X is done.” Routine completion, visual indicator sufficient.

* **No notification:** Routine news module appearing. Just show the module.

## **4.4 Chattiness Setting**

Users set a chattiness level on the phone, ranging from “quiet” (almost never speaks, visual indicators only) to “conversational” (narrates activity, offers suggestions proactively). Default should be moderate—speaks for significant events, silent for routine operations.

## **4.5 Persistence**

The avatar is always persistent on screen. It never fully disappears and reappears. Appearing from nothing feels like a popup notification. A persistent presence that modulates its energy level feels like a companion. This is a subtle but meaningful difference for something in your living room every day. In fullscreen mode, the avatar remains as a small semi-transparent overlay in a corner.

## **4.6 Implementation**

The avatar is rendered as a Lottie animation or CSS/Canvas animation within the React screen app. Lottie is the recommended approach—it allows a designer to create the avatar animations in After Effects and export them as lightweight JSON files that render smoothly on all platforms, including Fire TV and webOS. Each avatar state (dormant, attentive, active, waiting) is a separate animation that the screen app crossfades between based on avatar\_state messages from the server. For the initial prototype, a simple CSS-animated radial gradient with opacity and scale transitions is sufficient to validate the concept before investing in Lottie assets.

# **5\. Phone App**

## **5.1 Role**

The phone is the command console, trust layer, and profile controller. It has three primary functions: issuing commands to the system (text and voice input), managing permissions and approvals, and controlling which profile is active on the TV. It is not a mirror of the TV screen. It is a structured feed of interactions scoped to the active user.

## **5.2 Technology**

The phone app is built with React Native, providing a single codebase that runs on both Android and iOS. This ensures all household members can use the system regardless of their phone platform.

## **5.3 App Sections**

**Profile Switcher**

Prominently displayed at the top of the app. Shows the currently active profile on the TV (Family, Mom, Dad, etc.). Tapping a profile activates it on the TV, transitioning the screen to that user’s personalized view. A “Family” button always returns the TV to the shared, non-sensitive Family mode. The profile switcher is the primary way users control what’s on the shared screen.

**Command Input**

A simple text field and voice button at the top of the app. The user types or speaks a command, which is sent to the server’s orchestrator via WebSocket. The input area shows a brief status indicator when the orchestrator acknowledges receipt.

**Activity Feed**

A reverse-chronological feed of system activity. Each item is one of: an approval request (permission or clarification needed), a task status update (“searching...”, “complete”, “failed”), or a prompt from an agent (“I found 3 options, which do you prefer?”). Items that need action are visually prominent. Completed items fade. This feed is the phone’s primary view.

**Module Control**

A list of currently active modules on screen. Each shows the module type, status, and actions (dismiss, pin, expand, minimize). This gives the user direct control over the TV layout from the phone without looking at the TV.

**Jobs/Schedules Manager**

Configuration interface for recurring scheduled tasks. Each job has a name, a natural language prompt (e.g., “Write me a semiconductor news report covering the last day”), a cron-style schedule (e.g., “every morning at 9am”), and a toggle to enable/disable. Jobs are stored on the server. The phone is just the configuration UI.

**Settings**

Profile management (create/edit profiles, link accounts per profile), permission defaults (per-profile trust levels), avatar chattiness slider, ambient module configuration (which widgets appear per profile in idle mode), and system connection settings (server IP/port).

## **5.4 Notification Behavior**

When the system needs phone interaction (permission request, clarification, or choice), the phone receives a push notification or in-app alert. The notification should be concise and actionable—ideally answerable from the notification shade without opening the app (e.g., “Allow email access? \[Yes\] \[No\]”).

# **6\. Profile System**

## **6.1 Concept**

The TV is a shared screen in a shared space. Rather than building complex per-module sensitivity rules, the system uses profiles to control what content is visible on the TV. Profiles are the primary mechanism for managing privacy and personalization on a family screen.

## **6.2 Profile Types**

**Family Profile (Default)**

The default profile when no individual user has activated their personal profile. This is the passive, always-safe mode. It displays only content that is appropriate and useful for the entire household. No personal email, no individual work content, no sensitive data.

Example content in Family mode:

* Weather and traffic for the household’s location

* Shared family calendar events (school events, family dinners, appointments)

* Family checklists (grocery list, vacation packing, chores)

* General news headlines

* Family vacation research and planning

* School event reminders

* Shared photo slideshow

* Family-friendly media recommendations

**Individual Profiles (Mom, Dad, etc.)**

Each family member can have a personal profile. When activated from their phone, the TV transitions to show that person’s personalized content: their email digest, their calendar, their work tasks, their news interests, their scheduled job outputs. When they deactivate their profile (or leave the room, or after a timeout), the screen returns to Family mode.

Example content in an individual profile:

* Personal email digest and summaries

* Individual work calendar and meetings

* Personal scheduled job outputs (e.g., semiconductor news report)

* Personal task results from ad-hoc commands

* Individual music and media preferences

* Personal news topics and research

## **6.3 Profile Activation**

Profiles are activated and deactivated from the phone app. When a user opens the phone app and taps their profile, the server switches the TV to their personal view. This is a deliberate, conscious action—the user is choosing to put their content on the shared screen. The phone app shows which profile is currently active on the TV.

Activation rules:

* Only one individual profile can be active at a time on a given TV

* Activating a profile sends a profile\_activate message to the server

* The server transitions the screen from Family mode to the individual’s layout

* The avatar acknowledges the switch (“Switching to Dad’s view”)

* Deactivation returns to Family mode automatically

## **6.4 Profile and Data Scoping**

Profiles scope more than just what’s on screen. They scope the entire agent context:

* **Ambient modules:** Family profile shows shared calendar and generic news. Individual profiles show personal calendar, personal email digest, and personalized news.

* **Agent permissions:** Each profile has its own permission settings. Dad might have “always allow” for email access; the Family profile has no email access at all.

* **Scheduled jobs:** Jobs are owned by a profile. Dad’s semiconductor news report only runs and displays when Dad’s profile is active (or it runs in the background and the output waits until his profile is activated).

* **Command context:** When Dad issues a command from his phone, the orchestrator knows it’s Dad and has access to Dad’s integrations, preferences, and history. Commands issued while Family mode is active are scoped to family-shared resources only.

## **6.5 Single-User Simplification**

For households with a single user, the profile system still applies but simplifies to just one profile that is always active. The Family profile effectively becomes the user’s personal profile. The system should work cleanly in this mode without requiring the user to think about profiles at all—there is no profile switching, no activation step, and all content displays directly.

## **6.6 Profile Configuration**

Profiles are configured in the phone app’s Settings section. Configuration includes:

* Profile name and optional avatar/color for identification

* Connected accounts (which email, calendar, and services are linked)

* Permission defaults for this profile

* Ambient module preferences (which widgets appear in idle mode)

* Auto-deactivation timeout (return to Family mode after N minutes of inactivity)

## **6.7 Screen Transitions**

When switching profiles, the screen should transition smoothly. Ambient modules for the outgoing profile fade out, the avatar briefly acknowledges the switch, and the incoming profile’s ambient modules fade in. The transition should take 1–2 seconds and feel intentional, not jarring. The layout positions remain stable (weather stays top-right, calendar stays left) but the content within each module changes to reflect the new profile’s data.

# **7\. Permission System**

## **7.1 Design Philosophy**

The phone is the trust layer. The orchestrator will never take sensitive actions without approval from the phone. However, permission fatigue is a real risk—if every multi-step task requires multiple approvals, users will either set everything to “always trust” or stop using the system. The permission system must have sensible defaults and minimize friction for low-risk operations. Permissions are scoped per-profile—the Family profile has a more restrictive default set than individual profiles.

## **7.2 Permission Tiers**

| Tier | Behavior | Examples |
| :---- | :---- | :---- |
| Always Allow | No approval needed. Auto-granted. | Web search, weather lookup, playing public media, displaying charts |
| Ask Once Per Session | Approved once, valid until system restart. | Reading email, reading calendar, accessing browsing history |
| Always Ask | Requires explicit approval every time. | Sending messages, making purchases, posting to social media |

## **7.3 Scoped Trust**

Beyond the three tiers, the system supports scoped trust grants: “Trust this agent to read my email for the next hour” or “Trust for this task only.” This provides fine-grained control without permanent permission changes.

## **7.4 Privacy on the Shared Screen**

The profile system is the primary privacy mechanism. The Family profile simply does not have access to personal data—there is no email to accidentally display, no personal calendar to leak. Individual profiles show personal content, but only when a user has deliberately activated their profile from their phone, accepting that their content will be on the shared screen.

Within an individual profile, an additional layer of content sensitivity still applies:

* **Full display:** Weather, news, media, charts, calendar events. Shown on TV normally.

* **Summarized display:** Email and messages show AI-generated summaries on TV. Full content available on the phone only.

* **Phone-only:** Highly sensitive results (financial details, medical info) show a placeholder on TV (“Results sent to your phone”) with full output on the phone.

## **7.5 Audit Log**

The phone maintains a running audit log per profile of all permissions granted and used. This is accessible in Settings and shows what resources each agent has accessed, when, and for what task. This builds trust through transparency.

# **8\. Task and Job Model**

## **8.1 Three-Layer Hierarchy**

The system distinguishes between three concepts:

**Scheduled Jobs**

Configured on the phone, stored on the server, never visible on screen. These are cron-style definitions: “Every morning at 9am, run the semiconductor news agent.” The phone is where you create, edit, and delete jobs. They are system configuration, not screen content.

**Task Instances**

When a scheduled job fires or the user issues an ad-hoc command, it creates a task instance. This is ephemeral. It runs, may show a brief activity indicator on screen, produces a result, and the result becomes a module. The task itself is not the point—the output is.

**Modules**

The visible artifacts on screen. A semiconductor report appears as a news module at 9:05am. The user reads it, maybe taps into it for more detail, eventually dismisses it or it gets pushed out by newer content.

## **8.2 Task Flow**

The flow is: Job → Task Instance → Module. For ad-hoc commands, the flow starts at Task Instance (no job). The task list is not a permanent screen fixture. It is a thin activity indicator that appears in the sidebar when agents are working (“Generating semiconductor report...”) and fades when they finish and the module appears.

## **8.3 Agent Output Structure**

Each sub-agent returns a structured response to the orchestrator:

{  
  taskId: "abc123",  
  status: "complete",  
  result: {  
    summary: "...",  
    sources: \[...\]  
  },  
  renderHint: {  
    type: "news-card",  
    embedVideo: "https://youtube.com/...",  
    priority: "high"  
  },  
  sensitivity: "public"  
}

The renderHint tells the orchestrator what kind of module to create and how much priority it should have. The orchestrator then decides the layout mode and module placement based on the hint and current screen state.

# **9\. Communication Protocol**

## **9.1 Transport**

All communication uses WebSocket connections over the local network. The server is the hub. The phone and screen are both clients that connect to the server. The protocol is JSON messages with a type field for routing.

## **9.2 Message Types**

**Phone → Server**

| Message Type | Payload | Description |
| :---- | :---- | :---- |
| command | { text, inputType, profileId } | Natural language command from user, scoped to active profile |
| profile\_activate | { profileId } | Switch TV to this user’s profile |
| profile\_deactivate | { } | Return TV to Family mode |
| permission\_response | { requestId, approved, scope } | Response to a permission request |
| clarification\_response | { taskId, response } | Response to an agent’s clarification question |
| module\_action | { moduleId, action } | Dismiss, pin, expand, or minimize a module |
| job\_create | { prompt, schedule, enabled } | Create a new scheduled job |
| job\_update | { jobId, changes } | Modify or toggle a scheduled job |
| settings\_update | { key, value } | Update permission defaults, chattiness, etc. |

**Server → Phone**

| Message Type | Payload | Description |
| :---- | :---- | :---- |
| permission\_request | { requestId, resource, agent, taskContext } | Request for user approval |
| clarification\_request | { taskId, question, options } | Agent needs user input |
| task\_update | { taskId, status, summary } | Task progress update |
| module\_list | { modules\[\] } | Current modules on screen |
| job\_list | { jobs\[\] } | Current scheduled jobs |

**Server → Screen**

| Message Type | Payload | Description |
| :---- | :---- | :---- |
| layout\_state | { mode, modules\[\], avatar, profileId } | Complete screen state including active profile. Sent on every change. |
| module\_update | { moduleId, data } | Incremental data update for a single module |
| avatar\_state | { state, message, priority } | Avatar state transition |
| profile\_switch | { profileId, profileName, transition } | Profile change with transition animation hint |

## **9.3 Streaming Updates**

For multi-step tasks, agents stream progress. The server forwards incremental module\_update messages to the screen so modules update progressively—first “searching...”, then “found 5 results, summarizing...”, then the final rendered card. This makes the screen feel alive rather than showing a loading spinner followed by a sudden content dump.

# **10\. Screen Client Implementation**

## **10.1 Shared Architecture**

All screen clients render the same React web application. The app is served by the server on the local network (e.g., http://192.168.1.50:3000/screen). Each platform wraps this web app in a thin native shell. The React app is stateless—all state lives on the server and is pushed to the screen via WebSocket.

The screen client is a reactive renderer. It receives layout\_state messages and renders the appropriate layout mode with the specified modules. Each module type (video player, chart, image gallery, news card, weather widget) is a React component. The app is essentially a dynamic component grid driven by server state.

## **10.2 Fire TV**

**Approach**

A thin Android app containing a full-screen WebView that loads the server’s screen URL. The app is sideloaded via ADB. This is approximately 50 lines of Kotlin—an Activity that creates a WebView, enables JavaScript, and loads the URL.

**Sideloading Process**

* Enable Developer Options on Fire TV: Settings → My Fire TV → About → click 7 times

* Enable ADB debugging

* From development machine: adb connect \<fire-tv-ip\> then adb install app.apk

* Install a sideload launcher (e.g., Sideload Launcher or Wolf Launcher) to access the app, or configure it to auto-launch on boot via a BOOT\_COMPLETED broadcast receiver

**Considerations**

Fire TV aggressively kills background apps and manages memory. A native WebView app handles this much better than a browser tab. The Fire TV Stick 4K Max has a quad-core processor and hardware video decoding, making it capable of rendering the module layout with video playback. For YouTube, use the iframe embed API rather than loading the full YouTube page to keep resource usage low.

## **10.3 LG webOS**

**Approach**

LG webOS TVs natively support web apps. The screen client can be deployed as a hosted web app that the TV loads from the server’s URL. webOS uses a Chromium-based browser engine, so the React app renders natively. Alternatively, it can be packaged as a webOS IPK app using the webOS TV SDK for a more integrated experience (auto-launch, app icon in launcher).

**Development Setup**

* Install LG webOS TV SDK and CLI (ares-cli)

* Enable Developer Mode on the TV via the LG Developer Mode app

* For hosted web app: simply navigate to server URL in TV browser

* For packaged app: ares-package, ares-install, ares-launch to deploy

**Considerations**

webOS Chromium versions vary by TV model year. Test against the target TV’s engine version. webOS supports WebSocket natively. The TV’s built-in web engine handles video playback well via HTML5 video and YouTube iframe embeds.

## **10.4 Web Browser (Generic)**

**Approach**

For any device with a browser and HDMI output (Raspberry Pi, mini PC, old laptop), simply open the server URL in Chromium in kiosk mode. This is the simplest path and the recommended approach for prototyping.

**Setup**

* Raspberry Pi or mini PC connected to TV via HDMI

* Chromium launched with: chromium-browser \--kiosk \--enable-gpu-rasterization http://\<server-ip\>:3000/screen

* For always-on: use pm2 or systemd to auto-launch Chromium on boot

* Disable screen blanking: xset s off && xset \-dpms

**Hardware Recommendations**

For prototyping, use whatever spare computer is available. For a dedicated setup, an Intel N100-based mini PC (around $100–150, brands like Beelink or MinisForum) provides dramatically more headroom than a Raspberry Pi and handles multiple video streams without issue. A Raspberry Pi 5 works but will feel the strain with multiple active modules. Keep the React app lean and use YouTube iframe embeds rather than loading the full YouTube page.

# **11\. Setup and Onboarding**

## **11.1 The Tension**

The “usable by anyone” and “local-first” tenets create a tension. Local-first means running a server on your home network, which is inherently more technical than signing up for a cloud service. The onboarding experience must bridge this gap—the initial setup may require a technically inclined household member, but daily use must not.

## **11.2 Initial Setup (One-Time, Technical)**

The server is installed on a home PC or mini PC by the household’s technical member. This is a one-time process:

* Install the server application (ideally a single installer or Docker container)

* The server starts and displays a setup wizard in a browser on the local machine

* The wizard walks through: entering an LLM API key (Anthropic), connecting data sources (Google Calendar, email via OAuth), and creating the first user profile

* The wizard generates a QR code displayed on screen for phone pairing

* The server announces itself on the local network via mDNS/Bonjour (e.g., gremlin.local) so devices can find it without knowing the IP address

## **11.3 Phone Pairing**

After the server is running, each household member pairs their phone:

* Download the Gremlin app from the App Store or Google Play

* Open the app, which automatically discovers the server on the local network via mDNS

* If auto-discovery fails, the user can scan a QR code shown on the TV or enter the server address manually

* The app walks through creating their profile: name, which accounts to connect (email, calendar), and permission preferences

* Pairing is complete. The phone is now connected.

## **11.4 TV Setup**

The TV screen client is connected by the technical household member:

* For Fire TV: sideload the app via ADB (see Section 10.2), then open it once. It connects to the server automatically via mDNS.

* For webOS: install the web app or open the server URL in the TV browser. Bookmark for easy access.

* For browser-based: open the server URL on the connected device. Set Chromium to kiosk mode for always-on display.

Once connected, the TV immediately shows the Family ambient dashboard. No further configuration is needed on the TV itself—all settings are managed from the phone.

## **11.5 Daily Use**

After initial setup, no technical knowledge is required. The TV turns on and shows the ambient dashboard. Family members open the phone app, which auto-connects to the server. They tap their profile to activate it, type or speak commands, and approve permissions when asked. The experience should feel as simple as using a TV remote—the infrastructure is invisible.

## **11.6 Adding New Users**

When a new family member wants to join, they download the phone app, which discovers the server automatically. An existing user with admin privileges approves the new member from their phone. The new user creates their profile and is ready to go. No server-side configuration is needed.

# **12\. Technology Stack**

| Component | Technology | Rationale |
| :---- | :---- | :---- |
| Server Runtime | Node.js / TypeScript | Async I/O, WebSocket native, shared language with screen client |
| WebSocket Server | ws or Socket.IO | Real-time bidirectional communication; Socket.IO adds reconnection handling |
| AI Orchestrator | Anthropic API (Claude) | Tool use for agent routing, strong instruction following |
| Sub-Agent Framework | Direct tool-use calls or AWS Bedrock Strands | Scoped agents with structured output |
| Job Scheduler | node-cron or Bull | Cron-style job scheduling with persistence |
| Screen App | React \+ Tailwind CSS | Component-based, smooth CSS transitions, rapid development |
| Screen Shell (Fire TV) | Kotlin Android WebView | Minimal native wrapper, \~50 lines |
| Screen Shell (webOS) | webOS hosted web app or IPK | Native web engine on LG TVs |
| Screen Shell (Generic) | Chromium kiosk mode | Zero platform-specific code |
| Phone App | React Native (Android \+ iOS) | Single codebase for both platforms, native feel |
| State Persistence | JSON file on disk | Simple, sufficient for single-user. SQLite if needed later. |
| Video Playback | YouTube IFrame API | Lightweight, hardware-decoded on most platforms |
| Music Playback | Spotify Web Playback SDK | Browser-based Spotify control |

# **13\. Implementation Roadmap**

## **Phase 1: Core Loop (Weeks 1–3)**

Build the minimal end-to-end flow: phone sends text command → server orchestrator receives it → a single agent executes (web search) → result appears as a module on the screen. This validates the architecture, the WebSocket protocol, and the basic screen rendering.

* Server: WebSocket server, orchestrator skeleton, one sub-agent (web search)

* Screen: React app with idle mode (clock \+ placeholder widgets) and focus mode (one module)

* Phone: Minimal web page with a text input that sends commands via WebSocket

* Platform: Run screen in a desktop browser; phone is a second browser tab

## **Phase 2: Ambient Layer (Weeks 4–5)**

Build out the idle mode ambient dashboard. Add real data sources: weather API, calendar integration (Google Calendar), and basic news fetching. Add the avatar in dormant state.

* Weather, calendar, and news ambient modules

* Avatar component with dormant and attentive states

* Auto-refresh cycles for ambient data

## **Phase 3: Profile System and Phone App (Weeks 6–8)**

Build the profile system and the phone as a React Native app (Android and iOS). Implement Family and individual profiles. Build the permission broker and the phone’s approval feed. Add email integration as the first permission-gated resource.

* React Native phone app with command input, activity feed, and profile switcher

* Profile system: Family default, individual profiles with scoped data

* Permission broker with three tiers, scoped per-profile

* Email agent with summarized-on-TV, full-on-phone privacy model

* Profile activation/deactivation from phone with smooth screen transitions

## **Phase 4: Media and Rich Modules (Weeks 9–10)**

Add YouTube and Spotify integration. Build the media agent. Add focus, split, and fullscreen layout modes with animated transitions.

* YouTube iframe player module

* Spotify Web Playback module

* Layout mode transitions with CSS animation

## **Phase 5: Scheduled Jobs and Multi-Agent (Weeks 11–13)**

Add the job scheduler and the phone’s job configuration UI. Jobs are scoped to profiles. Add additional sub-agents (data/charts, multi-step research). Enable multi-module scenarios.

* Job scheduler with cron expressions

* Phone job manager UI

* Chart/data visualization module

## **Phase 6: Platform Deployment (Weeks 14–16)**

Package the screen client for Fire TV (Android WebView APK) and webOS (hosted web app or IPK). Test on real TV hardware. Optimize for 10-foot viewing.

* Fire TV: Kotlin WebView wrapper, sideloading, boot auto-launch

* webOS: hosted app or packaged IPK via ares-cli

* Performance optimization for TV hardware

* 10-foot UI polish: font sizes, contrast, readability at distance

# **14\. Known Risks and Mitigations**

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| Agent reliability / hallucination | Wrong info displayed prominently on TV | Robust timeout handling, graceful error states, source attribution on all modules, confidence indicators |
| Permission fatigue | Users set everything to "always trust" or stop using system | Sensible defaults (read-only auto-approved), scoped trust grants, actionable notification cards |
| Shared screen privacy | Sensitive info visible to others in room | Profile system: Family mode shows only shared content. Individual profiles require deliberate activation. |
| Scope creep | Months of infrastructure, no usable product | Phase 1 delivers end-to-end flow in 3 weeks. Validate core loop before building platform. |
| TV hardware limitations | Slow rendering, video stutter | Lean React app, YouTube iframe API, lazy-render off-screen modules, test on target hardware early |
| Network dependency | System unusable if server offline | Screen shows last-known ambient state from cached data. Phone shows connection status. |
| Cold start engagement | Users forget about the system | Strong ambient layer provides passive value. Scheduled jobs deliver proactive content. |
| Profile complexity | Over-engineering for single-user households | Single-user mode collapses to one always-active profile with no switching required. |

# **15\. Future Considerations**

* **Roku support:** Roku’s platform is more restrictive (BrightScript/SceneGraph). A Roku channel would need to be built natively rather than using a WebView wrapper. Deferred to a future release.

* **Voice input on TV:** Adding a microphone to the TV device (or using the TV’s built-in mic on supported models) would enable hands-free commands without reaching for the phone. The phone remains the approval surface.

* **Multi-user support:** Multiple phones could connect as separate commanders. Modules could be tagged by who requested them. The orchestrator would handle concurrent task streams.

* **Ongoing/monitoring tasks:** Tasks that persist beyond a single execution, like “monitor this stock and alert me if it drops below $150.” These require a different task model with event-driven triggers rather than cron schedules.

* **Smart home integration:** Connecting to Home Assistant or SmartThings to display and control smart home devices from the TV.

* **MCP integration:** Using Model Context Protocol to expose the system’s capabilities as tools that other AI systems can invoke, or to connect sub-agents to external MCP servers for richer tool access.

* **Local AI models:** Running smaller models locally on the server for latency-sensitive tasks (intent classification, ambient data summarization) while using cloud models for complex reasoning.