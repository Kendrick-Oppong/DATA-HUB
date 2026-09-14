# Smart Data Hub

## Product and UI Design Brief

**Document purpose:** Give a product-design or code-generation AI enough context to redesign Smart Data Hub as a polished, production-ready web and mobile product.

**Product:** Smart Data Hub (SDH)
**Market:** Ghana
**Primary currency:** Ghana cedi (GH₵)
**Networks:** MTN, Telecel, AirtelTigo
**Core promise:** Buy, sell, manage, and deliver digital services with confidence.
**Design ambition:** A trusted consumer-fintech experience with the operational clarity of a serious commerce platform.

---

## 1. Product Definition

Smart Data Hub is a digital-services platform for Ghana. Customers can buy data bundles, airtime, exam vouchers, AFA registration services, and utilities. Agents/resellers can sell those services through a personal online store, set margins, manage customers, send bulk SMS, and withdraw earnings. Administrators operate the platform, review transactions, manage pricing, approve requests, and monitor fulfilment.

The product has six connected experiences:

1. **Public marketing site** - explains the service and converts visitors.
2. **Customer app** - buying, wallet, orders, profile, support, and education.
3. **Agent workspace** - commerce, store building, sales, earnings, customers, and campaigns.
4. **Admin console** - platform operations, pricing, approvals, users, reporting, and incident control.
5. **Public agent storefront** - a lightweight, branded checkout experience for every agent's unique public store.
6. **Mobile app shell** - a focused phone-first version of the customer/agent experience.

The UI should make a person feel that money and delivery status are being handled carefully. The visual language must be confident, legible, fast, and calm under operational pressure.

---

## 2. Product Design Foundations

This is a from-scratch product design. The existing product is only a visual and workflow reference. Do not preserve its visual language, layout assumptions, data model, technical structure, or placeholder content. Rebuild the experience around the product goals, user needs, and interaction rules in this brief.

### Design system foundation

- Recreate the visual language of shadcn/ui with vanilla HTML, Tailwind CSS v4, and JavaScript. Use the principles of accessible, composable primitives without requiring React or another UI framework.
- Use semantic theme variables rather than hard-coded colors.
- Use Lucide-style interface icons with labels or tooltips where needed.
- Use composable primitives for buttons, forms, dialogs, drawers, tables, tabs, command search, alerts, skeletons, charts, and navigation.
- Use production-quality validation, optimistic feedback, retry states, and clear data ownership in the prototype.
- Keep the design system small, coherent, and reusable. Do not create a different visual language for every page.

### Shadcn-style theme contract

“Vanilla JavaScript” describes the interaction technology. “Tailwind CSS v4” describes the styling pipeline. “shadcn approach” describes the design system and theme architecture. Keep all three requirements together: the prototype must recreate shadcn's semantic, token-driven visual system with Tailwind v4 utilities and CSS variables, without React or another UI framework.

Use the same semantic CSS variable model that shadcn themes use. Components must consume semantic tokens, never page-specific hex values:

```css
:root {
  --background: 210 20% 98%;
  --foreground: 222 30% 14%;
  --card: 0 0% 100%;
  --card-foreground: 222 30% 14%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 30% 14%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 18% 94%;
  --secondary-foreground: 222 30% 14%;
  --muted: 210 18% 94%;
  --muted-foreground: 215 15% 44%;
  --accent: 42 95% 56%;
  --accent-foreground: 222 30% 14%;
  --destructive: 3 67% 48%;
  --destructive-foreground: 0 0% 100%;
  --border: 214 20% 88%;
  --input: 214 20% 88%;
  --ring: 221 83% 53%;
  --radius: 0.625rem;
  --success: 151 55% 36%;
  --warning: 38 90% 46%;
}

.dark {
  --background: 222 35% 9%;
  --foreground: 210 25% 96%;
  --card: 222 30% 13%;
  --card-foreground: 210 25% 96%;
  --popover: 222 30% 15%;
  --popover-foreground: 210 25% 96%;
  --primary: 217 91% 63%;
  --primary-foreground: 222 35% 9%;
  --secondary: 222 24% 18%;
  --secondary-foreground: 210 25% 96%;
  --muted: 222 24% 18%;
  --muted-foreground: 215 17% 68%;
  --accent: 43 94% 62%;
  --accent-foreground: 222 35% 9%;
  --destructive: 3 75% 61%;
  --destructive-foreground: 222 35% 9%;
  --border: 222 20% 24%;
  --input: 222 20% 24%;
  --ring: 217 91% 63%;
  --success: 151 55% 48%;
  --warning: 38 90% 58%;
}
```

Theme rules:

- Use HSL channel variables with `hsl(var(--token))` so the theme can be changed centrally.
- Toggle `.dark` on the document root; support Light, Dark, and System preferences.
- Persist an explicit theme choice and apply it before the first paint to prevent a flash of the wrong theme.
- Define component variants in the shadcn style: default, secondary, outline, ghost, link, destructive, and disabled.
- Use semantic states for success, warning, destructive, pending, and informational feedback. Do not invent a new color for each screen.
- Use `--card` for framed records and tools, `--background` for page canvas, `--popover` for overlays, `--muted` for secondary regions, and `--border` for structure.
- Use one restrained radius scale derived from `--radius`; do not give every element a different pill shape.
- Use soft, theme-aware shadows only for elevation. Never use shadows as a substitute for hierarchy or contrast.
- Test buttons, inputs, tabs, tables, charts, banners, dialogs, dropdowns, skeletons, empty states, and images in both themes.

### Prototype technology constraint

The first deliverable is a **fully working vanilla JavaScript prototype styled with Tailwind CSS v4**. It should run through a minimal static development command and produce a static browser build. Do not require React, Next.js, TypeScript, a database, or a UI framework in the prototype.

- Use semantic HTML, modern CSS, and plain JavaScript modules.
- Use Tailwind CSS v4 as the primary styling layer, with the official v4 CSS-first configuration approach and `@theme` tokens where appropriate.
- Keep shadcn semantic variables in CSS and map them to Tailwind utilities. Use utility classes for layout and component styling rather than a large page-specific stylesheet.
- Use a small Tailwind v4 build pipeline for development and a static compiled CSS output for review.
- Keep data in a small, understandable in-memory store with `localStorage` persistence for the demo.
- Use hash-based or History API navigation so every screen has a stable destination and browser back/forward works.
- Use reusable HTML render functions and custom elements only where they genuinely simplify repetition.
- Keep the design tokens in one CSS file and the mock data/state in one JavaScript module.
- Simulate network latency intentionally so loading, success, failure, retry, and empty states can be reviewed.
- Make all important flows work without a backend: use realistic seeded demo data and deterministic mock actions.
- The later Next.js conversion should be straightforward, but the prototype must not contain framework-specific component syntax or assumptions.

### Prototype completion rule: no dead interactions

Every visible interactive element must do one of the following:

1. Navigate to a real screen.
2. Open a working dialog, drawer, sheet, popover, or menu.
3. Change visible application state.
4. Submit a complete simulated flow and show its result.
5. Open a real external destination such as WhatsApp, email, phone, or a downloadable receipt.

Never use a dead `href="#"`, an inactive button, a fake dropdown, a “Coming soon” action without an explanation screen, or a control that changes nothing. Disabled controls must explain why they are disabled. Every close, cancel, back, retry, save, delete, copy, share, filter, tab, pagination, and menu action must be implemented.

### Complete prototype flow map

The prototype must include the following end-to-end journeys. A generated design is incomplete if it only renders the first screen of a journey.

| Journey                   | Required sequence                                                                                                  | Final state                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Customer data purchase    | Choose network → choose bundle → enter recipient → review price → choose wallet or MoMo → confirm → track delivery | Receipt with reference, status timeline, copy/share/track actions         |
| Customer airtime purchase | Choose network → enter amount → enter recipient → review → payment → confirmation                                  | Receipt with repeat purchase and support actions                          |
| Results checker           | Choose exam/voucher → choose quantity → enter phone → review → pay → reveal voucher                                | Masked voucher card with reveal, copy, download, and check-result actions |
| AFA registration          | Explain eligibility → collect phone and identity details → consent → review fee → pay → submit                     | Application timeline with correction/support actions                      |
| Utility payment           | Choose service → choose provider → enter account/meter → validate → enter amount → review → pay                    | Payment receipt and retry/track actions                                   |
| Track order               | Enter phone or reference → validate → search → select result                                                       | Public-safe order timeline, receipt, and support action                   |
| Fund wallet               | Choose amount → choose payment method → confirm → simulate pending/success/failure                                 | Updated balance, transaction record, retry or support action              |
| Agent application         | Read benefits → enter business details → review → submit                                                           | Application status with next steps and edit/support actions               |
| Store publishing          | Edit identity → configure products/prices → preview → validate checklist → publish → share                         | Published storefront preview, QR/share actions, pause/edit actions        |
| Store order               | Customer opens store → selects product → enters number → applies promo → pays → receives receipt                   | Customer tracking plus agent order notification                           |
| Bulk SMS                  | Select audience → choose sender → compose → validate recipients → estimate credits → review → send/schedule        | Campaign detail with delivery progress, cancel/support actions            |
| Withdrawal                | Enter amount → choose MoMo destination → review fees → confirm code → submit                                       | Payout timeline with receipt, cancel/support actions                      |
| Complaint                 | Choose category → attach order/reference → describe issue → submit → reply                                         | Thread with status, SLA, reply, and close/reopen actions                  |
| Admin payout review       | Open queue → inspect payout/account history → approve or reject with reason → confirm                              | Updated queue, audit event, and notification outcome                      |
| Admin pricing update      | Select product → edit values → preview margin impact → validate → publish                                          | Versioned confirmation with undo/review history                           |

### Required prototype states

Every journey must demonstrate these states using realistic content:

- First visit and onboarding.
- Populated data.
- Empty data with a next action.
- Loading skeleton.
- Inline validation error.
- Full operation failure with retry.
- Payment pending.
- Payment success.
- Payment failure and alternate method.
- Delivery processing.
- Delivery success.
- Delivery failure and correction.
- Permission-restricted action.
- Unsaved changes.
- Destructive confirmation.
- Offline or weak-connection recovery.

### Button and link destination inventory

Before handoff, create a simple interaction audit with one row for every visible button, icon button, tab, menu item, card action, link, and form submission. Each row must state its destination or state change. The audit must have zero rows marked “TBD”, “later”, “coming soon”, or “not implemented”.

At minimum, implement destinations for:

- Every sidebar item and mobile bottom-navigation item.
- Every public navigation and footer item.
- Every primary and secondary CTA.
- Every bundle/product card.
- Every order, transaction, notification, complaint, customer, campaign, payout, and application record.
- Every table filter, sort, pagination, export, refresh, and saved view action.
- Every top-bar icon, profile menu action, theme option, help action, and command-search result.
- Every modal open/close/cancel/confirm action.
- Copy, share, download, print, retry, refund, report, contact support, and go-back actions.

---

## 3. Design Direction

### Creative thesis: “Signal, not noise”

Smart Data Hub sits at the intersection of mobile connectivity, money movement, and small-business operations. The signature visual should be a **signal rail**: a thin, animated, modular line system inspired by network coverage bars, transaction timelines, and Ghanaian woven pattern rhythm. It should appear sparingly in page headers, order status, empty states, and chart accents. It is the recognizable SDH device, not decoration everywhere.

Avoid generic dashboard design: no wall of identical cards, no purple gradient hero, no excessive glassmorphism, no giant marketing copy with no product proof, and no nested cards.

### Screenshot analysis: what to keep and what to replace

The supplied TapData screenshots are useful as a **workflow reference only**. They show a logged-in service dashboard with a fixed navigation rail, a compact utility header, bundle selection, results-checker education, bulk-SMS packages/campaigns, order tracking, wallet, wallet ledger, agent recruitment, and a customer dashboard. They are not a visual specification for Smart Data Hub and must not be copied literally.

#### Patterns worth keeping

- **Persistent navigation rail:** Users can jump between buying, tracking, wallet, orders, and agent tools without returning home.
- **Compact top utility bar:** Wallet/balance, notifications, cart, profile, and role are always close at hand.
- **Service tabs:** Buy/check/history is a strong mental model for Result Checker and other multi-step products.
- **Bundle tiles:** Showing size, validity, and price together makes comparison fast.
- **Large service header:** A focused banner can orient a user before a complex workflow such as Results Checker or Bulk SMS.
- **Actionable empty states:** “Enter details to track”, “Browse bundles”, and “No transactions yet” are better than blank tables.
- **Separate balance concepts:** Main wallet, commission balance, SMS credits, and cart total should never be visually conflated.
- **Simple Ghanaian purchase vocabulary:** Bundle, wallet, track order, MoMo, AFA, WAEC, BECE, and SMS are recognizable local terms.

#### Problems to solve in the redesign

- The screenshots use repeated white rounded panels and large unused areas, which makes the product feel like a generic template.
- Branding is inconsistent: the screenshots say “TapData” while this product is Smart Data Hub. Use one SDH identity everywhere.
- The sidebar is visually persistent but not information-rich enough: add active context, compact badges, collapsed mode, and keyboard search.
- Important pages lack a consistent page header, breadcrumb, primary action, and secondary action hierarchy.
- Bundle cards are easy to scan but have weak selection feedback, no comparison state, and no visible purchase summary.
- Wallet, ledger, orders, and tracker pages need stronger relationships between records, statuses, references, and next actions.
- The blue hero banners are visually strong but too tall for repeated use. Reserve them for service introductions and use compact headers for operational pages.
- Dark mode cannot be achieved by simply changing the page background. Surface hierarchy, borders, charts, inputs, selected states, and imagery all need explicit dark tokens.
- The current screenshots expose mostly zero-data states. The new design must also show credible populated, loading, error, pending, failed, and permission states.

#### Screenshot-derived interaction improvements

- Selecting a bundle should open a persistent purchase summary on desktop and a sticky bottom summary on mobile.
- “Card View”, “Text Input”, and “Excel Import” should be a real input-mode segmented control with mode-specific validation and preview.
- Results Checker should have a guided split between buying a voucher, checking a result, and history, with no information hidden below an oversized hero.
- Bulk SMS should show recipient source, character encoding, pages, estimated credits, wallet/SMS balance, sender approval, and send readiness in one review surface.
- Track Order should accept phone number **or reference**, remember recent lookups locally, and show a public-safe result without requiring a full account.
- Wallet and ledger should share a transaction-detail drawer so users understand the difference between available cash, commission, credit, debit, and refund.
- Agent recruitment should show an eligibility/application status journey after submission, not only a static form.

### Ghana market research guardrail

Public Ghana data-selling websites and mobile-money pages often change, use client-rendered content, or cannot be reliably extracted by automated research. Treat any external site as a pattern reference, not a source of truth. Before implementation, manually review current Ghana competitors and providers for pricing language, network naming, payment methods, supported-number rules, customer support expectations, and trust signals. Do not copy their copy, logos, imagery, colors, or layout.

Useful market patterns to investigate manually:

- Local data bundle aggregators: fast network selection, clear validity, number-first checkout, and immediate delivery messaging.
- MoMo payment experiences: recognizable provider options, explicit pending states, confirmation references, and recovery when a payment is interrupted.
- Agent/reseller platforms: wholesale versus retail clarity, wallet funding, commission visibility, customer records, and shareable storefronts.
- Ghanaian education-service sellers: WAEC/BECE naming, voucher secrecy, result-check steps, and support for failed codes.

The design must be specific to SDH even when it uses these proven interaction patterns.

Use the following products as pattern references only:

- **Stripe Dashboard:** dense but readable financial operations, clear status language, excellent table hierarchy.
- **Wise:** transparent money movement, human explanations of fees and states.
- **Shopify Admin:** focused commerce tasks, strong product/order/customer relationships, useful empty states.
- **Linear:** keyboard-friendly navigation, command search, restrained surfaces, purposeful motion.
- **Monzo/Revolut:** transaction clarity, approachable financial language, confidence around balances.
- **MTN Mobile Money:** local familiarity, strong transactional confidence, simple payment affordances.
- **shadcn/ui:** composable primitives, neutral surfaces, clear focus states, theme variables, and predictable interaction patterns.

Do not reproduce their branding, layouts, copy, or distinctive assets.

### Personality

- Reliable, not corporate-cold.
- Local and understandable, not childish.
- Efficient, not rushed.
- Bright where action matters, quiet where information matters.
- Premium through precision, not ornament.

### Typography: Bai Jamjuree is mandatory

Use **Bai Jamjuree** for the entire interface: headings, body copy, labels, buttons, navigation, tables, and marketing pages. The intended family name is the Google Fonts typeface commonly written as “Bai Jamjuree”; verify the exact CSS import/name during implementation.

- Weights: 400 body, 500 labels, 600 controls and subheads, 700 page titles, 700-800 hero display.
- Use `font-variant-numeric: tabular-nums` for balances, prices, dates, and counts.
- Use a monospace fallback only for technical identifiers such as payment references and integration keys; do not introduce a second display font.
- Do not use Poppins, Plus Jakarta Sans, Manrope, Geist, DM Sans, Arial, Roboto, or Inter as substitutes.
- Keep letter spacing at 0. Use generous line-height for public copy and compact line-height for tables and app navigation.

Recommended import:

```css
@import url("https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&display=swap");

:root {
  --font-sans: "Bai Jamjuree", sans-serif;
}
```

### Color tokens and light/dark mode

Light and dark mode are first-class product features, not a late theme toggle. Use semantic shadcn-style variables and test every component in both modes. The primary identity can remain electric blue, but it must be balanced with ink, cool surfaces, green success, amber attention, and coral risk.

```css
:root {
  --background: 210 20% 98%;
  --foreground: 222 30% 14%;
  --card: 0 0% 100%;
  --card-foreground: 222 30% 14%;
  --popover: 0 0% 100%;
  --primary: 221 83% 53%; /* SDH electric blue */
  --primary-foreground: 0 0% 100%;
  --secondary: 42 95% 56%; /* warm Ghana-gold action accent */
  --secondary-foreground: 222 30% 14%;
  --muted: 210 18% 94%;
  --muted-foreground: 215 15% 44%;
  --accent: 14 74% 56%; /* coral for alerts and emphasis */
  --accent-foreground: 0 0% 100%;
  --success: 151 55% 36%;
  --warning: 38 90% 46%;
  --destructive: 3 67% 48%;
  --border: 214 20% 88%;
  --ring: 221 83% 53%;
  --radius: 0.625rem;
}

.dark {
  --background: 222 35% 9%;
  --foreground: 210 25% 96%;
  --card: 222 30% 13%;
  --card-foreground: 210 25% 96%;
  --popover: 222 30% 15%;
  --primary: 217 91% 63%;
  --primary-foreground: 222 35% 9%;
  --secondary: 43 94% 62%;
  --secondary-foreground: 222 35% 9%;
  --muted: 222 24% 18%;
  --muted-foreground: 215 17% 68%;
  --accent: 14 78% 62%;
  --accent-foreground: 222 35% 9%;
  --success: 151 55% 48%;
  --warning: 38 90% 58%;
  --destructive: 3 75% 61%;
  --border: 222 20% 24%;
  --ring: 217 91% 63%;
}
```

Light mode: use cool near-white page background, white surfaces, dark navy text, subtle blue-gray borders, and blue primary actions. Dark mode: use near-black blue-gray background, lifted charcoal surfaces, soft borders, and slightly brighter blue controls. Never use pure white text on saturated blue for large bodies of copy. Network colors may be used as small recognizable badges, not page-wide themes.

Theme requirements:

- Respect system preference on first visit, then persist the user's explicit choice.
- Provide Light, Dark, and System options in settings.
- Charts, illustrations, hero imagery, focus rings, shadows, disabled controls, selected tabs, tables, and empty states each need dark-mode treatment.
- Verify contrast in both themes, including placeholder text and muted metadata.
- Do not flash the wrong theme during hydration.

### Layout principles

- Desktop app shell: 248px sidebar, flexible content area, max content width 1440px.
- Public pages: max width 1180px with generous editorial spacing.
- Admin tables: full-width work areas with sticky column headers and responsive table-to-list transformation.
- Use 8px spacing increments, with 12px and 16px radii only where the component warrants it.
- Page sections are bands or unframed layouts. Cards are reserved for repeated records, framed tools, and modals.
- Every page needs a clear primary action and a useful empty/loading/error state.
- Use breadcrumbs on deep admin and agent pages.
- Use a command menu (`Cmd/Ctrl + K`) for power users.

### Motion

- One orchestrated page entrance: title, summary, and first work surface reveal in sequence.
- Status changes use a short signal pulse, not confetti.
- Charts animate once on first load.
- Respect `prefers-reduced-motion`.
- Never animate layout dimensions in a way that shifts tables or form controls.

---

## 4. Global Navigation and Shells

### Public shell

- Logo and wordmark.
- Navigation: Home, Services, Agent program, FAQ, About, Contact.
- Primary actions: Buy data, Open dashboard.
- Footer: company, services, support, legal, contact details, social/community link.
- Mobile navigation: menu sheet with the same destinations and one primary action.

### Customer shell

Sidebar or mobile bottom navigation:

- Home
- Buy data
- Buy airtime
- Results Checker
- AFA Registration
- Utilities & Bills
- Wallet
- Orders
- Notifications
- Complaints
- How-to Guides
- What's New
- Profile

### Agent shell

Navigation groups:

- Overview: Dashboard, My Store
- Sell: Store Orders, Buy Data, Buy Airtime, AFA Registration, Results Checker, Utilities & Bills, Bulk SMS
- Earnings: Analytics, Earnings, Withdraw, Pricing
- Account: Wallet, Transactions, Customers, Notifications, Complaints, How-to Guides, Settings, What's New, Community

### Admin shell

Navigation groups:

- Operations: Overview, Order Monitor, Transactions, Commissions, Payouts, Complaints
- Services: AFA, Result Checkers, SMS / Sender IDs
- Manage: Beneficiary Tracker, All Agents, Users, Referrals & Tiers, Notifications, Pricing, Settings

Global shell elements:

- Workspace switcher for Admin, Agent, and Customer preview views.
- Wallet balance pill with a clear “Fund wallet” action.
- Notification bell with unread count.
- Search/command menu.
- Help menu.
- User menu with profile, settings, theme, sign out.
- Breadcrumbs on nested pages.

### Authentication and account-entry flows

Authentication is a complete product area, not a single sign-in screen. The prototype must let a reviewer move through every state with demo data and return to the intended destination without losing context.

#### Welcome and account choice

The first account-entry screen offers three clear paths:

- Continue as a customer.
- Create an agent account or apply to become an agent.
- Sign in to an existing account.

It also offers guest checkout for services that do not require an account and a visible “Track an order” path. The screen must explain the benefit of creating an account without blocking a visitor from an allowed purchase.

#### Sign-in flow

1. Enter phone number or email.
2. Enter password with show/hide control.
3. Validate the fields inline.
4. Submit and show a short loading state.
5. On success, return to the originally requested screen or open the correct dashboard.
6. On failure, keep the entered identifier, explain the problem, and offer retry and password recovery.

Required sign-in states:

- Empty form.
- Invalid phone/email.
- Incorrect password.
- Account not found.
- Account temporarily locked or rate limited.
- Verification required.
- Session expired.
- Successful sign-in.
- Signed-in account with pending agent approval.

#### Registration flow

1. Choose account type: Customer or Agent.
2. Enter name, phone, email where applicable, and password.
3. Show password requirements while typing.
4. Confirm consent to terms and privacy.
5. Send a six-digit verification code.
6. Verify the code with resend, edit-number, countdown, and invalid-code states.
7. Show success and continue to onboarding or the requested purchase.

The OTP screen must support paste, one-key navigation, keyboard accessibility, expiration, resend limits, and a safe masked destination. Never clear the entire form after a failed verification.

#### Password recovery

1. Choose recovery identifier.
2. Confirm the masked phone/email destination.
3. Enter verification code.
4. Create and confirm a new password.
5. Show success, sign the user in for the demo, and offer “Go to dashboard”.

Include invalid identifier, expired code, too many attempts, mismatched passwords, weak password, and successful reset states.

#### Agent application entry

An existing customer can choose “Become an agent” from the public site or customer workspace. Preserve their account identity, collect business name and operating details, show eligibility and payout expectations, submit the application, and land on an application-status screen. The status screen must support pending review, approved onboarding, needs correction, rejected with reason, and contact support.

#### Session and account transitions

- Sign out opens a confirmation when there is unsaved work, then clears the demo session and returns to the public home screen.
- Session expiry opens a focused re-entry dialog, preserves the current draft where possible, and provides a safe return path.
- Switching between Customer, Agent, and Admin preview views updates navigation, permissions, page title, and available actions together.
- Restricted actions show an explanation and the exact action needed to gain access.
- Back from auth returns to the previous public or product screen, never to a blank page.
- Every account-entry screen has links to help, terms, privacy, and contact support.

### Marketing navigation and link map

The marketing experience must be fully navigable before any backend is connected. Every item below is a real destination or a working action in the prototype.

| Visible element              | Destination or action                  | Required result                                                                          |
| ---------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Logo                         | Home                                   | Scroll to the top and reset the marketing page state                                     |
| Home navigation              | Home                                   | Show the marketing homepage                                                              |
| Services navigation          | Services                               | Show the service directory                                                               |
| Agent program navigation     | Agent program                          | Show the agent benefits and application CTA                                              |
| FAQ navigation               | FAQ                                    | Show searchable FAQ groups                                                               |
| About navigation             | About                                  | Show company mission and operating principles                                            |
| Contact navigation           | Contact                                | Show support channels and contact form                                                   |
| Buy data button              | Data purchase                          | Open the first step of the purchase flow; in demo mode, use a guest checkout             |
| Sign in / Dashboard button   | Customer dashboard or account entry    | Open the dashboard in demo mode, or the real account entry in production                 |
| Hero “Become an agent”       | Agent program                          | Move to the agent program page or its application flow                                   |
| Hero “See how it works”      | How it works section                   | Scroll to the process explanation without changing pages                                 |
| Network badge/card           | Services or data purchase              | Filter the service directory or preselect that network in checkout                       |
| Service card                 | Service detail or service flow         | Open a real service detail view with a clear start action                                |
| Service “Buy data”           | Data purchase                          | Open data bundle selection                                                               |
| Service “Buy airtime”        | Airtime purchase                       | Open airtime purchase                                                                    |
| Service “Learn more”         | Service detail                         | Open the relevant service explanation and CTA                                            |
| Agent earnings calculator    | Calculator state                       | Update earnings, margin, and projected monthly totals visibly                            |
| Agent “Apply now”            | Agent application                      | Open the complete application flow                                                       |
| Agent “See pricing”          | Agent program pricing explanation      | Show wholesale, retail, margin, and payout explanation                                   |
| FAQ question                 | Accordion state                        | Expand/collapse the answer and update the URL fragment                                   |
| FAQ search                   | FAQ results                            | Filter answers, show result count, and provide clear-search action                       |
| FAQ “Still need help?”       | Contact                                | Open contact support with the relevant category preselected                              |
| About “Our services”         | Services                               | Open the service directory                                                               |
| About “Contact us”           | Contact                                | Open contact support                                                                     |
| Contact WhatsApp             | WhatsApp                               | Open the configured WhatsApp conversation in a new tab                                   |
| Contact email                | Email client                           | Open a prefilled support email with subject and context                                  |
| Contact phone                | Phone action                           | Start a phone call on supported devices                                                  |
| Contact form submit          | Confirmation state                     | Validate, show submitted status, reference number, response expectation, and next action |
| Footer Services links        | Services or individual service detail  | Open the matching destination                                                            |
| Footer Agent program link    | Agent program                          | Open the agent program page                                                              |
| Footer About link            | About                                  | Open the About page                                                                      |
| Footer FAQ link              | FAQ                                    | Open the FAQ page                                                                        |
| Footer Contact link          | Contact                                | Open the Contact page                                                                    |
| Footer Terms link            | Terms                                  | Open readable legal terms                                                                |
| Footer Privacy link          | Privacy                                | Open the privacy page                                                                    |
| Footer Compliance link       | Compliance                             | Open legal/compliance information                                                        |
| Footer WhatsApp link         | WhatsApp                               | Open the configured WhatsApp destination                                                 |
| Footer email link            | Email client                           | Open a prefilled support email                                                           |
| Footer social/community link | Real configured external destination   | Never render a social link unless its destination is configured                          |
| Mobile menu item             | Same destination as desktop navigation | Close the menu and navigate to the selected screen                                       |
| Mobile menu Buy data         | Data purchase                          | Close the menu and open checkout                                                         |
| Theme toggle                 | Theme state                            | Switch Light/Dark/System and persist the selection                                       |
| Back-to-top action           | Page top                               | Smooth-scroll to the page header and move focus appropriately                            |
| Legal contents item          | Section anchor                         | Scroll to the section and update the fragment                                            |

Marketing rules:

- Do not use placeholder `#` links. Use real page identifiers, section anchors, or configured external URLs.
- Every marketing page has a primary CTA, a secondary CTA, and a support escape hatch.
- When a visitor clicks a product CTA, preserve their selected service/network when moving into checkout.
- When an action requires an account, explain the requirement and provide both “Continue as guest” where allowed and “Create an account” where needed.
- External links must visibly indicate that they open outside the product and must work in the prototype with safe placeholder destinations clearly marked for replacement.
- Broken, unavailable, or unconfigured destinations must open a helpful state page, never silently do nothing.

---

## 5. Existing Public Pages

### Home

**Job:** Explain trust and value within five seconds, then drive a first purchase or agent signup.

The homepage includes live network coverage, hero CTAs, proof statistics, service benefits, a three-step purchase explanation, network compatibility, and agent recruitment content.

Redesign requirements:

- Product-forward hero with an interactive “buy a bundle” preview, not a decorative phone mockup alone.
- Show the three networks as practical options.
- Show proof: delivery speed, order count, uptime, and payment safety.
- Use a visible order status sample or delivery timeline as the signature signal rail.
- Primary CTA: “Buy data”. Secondary CTA: “Become an agent”.
- Show the next section edge in the first viewport.
- Include a compact FAQ and final CTA, but avoid a long marketing scroll with repeated cards.

### Services

**Job:** Help visitors understand what can be purchased and send them to the right flow.

Services include data bundles, airtime, digital subscriptions, business solutions, bulk SMS, and integrations for businesses.

Redesign requirements:

- Service directory with practical categories and price/availability hints.
- Each service has a “how it works” drawer or detail route.
- Show which services are available to customers versus agents.
- Use clear service states: Available, Coming soon, Requires agent account.

### Agent program

**Job:** Convert a potential agent by explaining economics, store ownership, and trust.

The page explains online stores, wholesale pricing, real-time commissions, auto-delivery, payouts, and the sales dashboard.

Redesign requirements:

- Earnings example with editable sales volume and margin assumptions.
- Agent journey: apply, get approved, configure store, sell, withdraw.
- Explain responsibilities and payout timing plainly.
- CTA: “Apply to become an agent”.

### FAQ

**Job:** Remove purchase, refund, eligibility, and delivery uncertainty.

Current content should become searchable accordion groups:

- Buying data and airtime.
- Supported numbers and networks.
- Payments and wallet.
- Failed delivery and refunds.
- AFA registration.
- Results Checker vouchers.
- Agent program and payouts.
- Privacy and account safety.

### About

**Job:** Establish the company, mission, values, and local credibility.

Use a confident editorial layout with real operating details, not generic stock imagery. Include company mission, operating principles, service footprint, support promise, and a contact CTA.

### Contact

**Job:** Let a visitor reach support quickly and provide enough detail for triage.

Add:

- WhatsApp CTA.
- Email support.
- Contact form with category and order reference.
- Support hours and expected response time.
- Emergency payment/order issue route.

### Legal and compliance

**Job:** Make trust and obligations readable.

Add sections for privacy, payment handling, account safety, acceptable use, agent obligations, data retention, and support escalation. Use a sticky contents index on desktop.

### Terms and conditions

**Job:** Present legally necessary terms in a readable, searchable format.

Use a version/date header, contents navigation, clear section anchors, and print/download affordance.

---

## 6. Existing Customer Pages

### Dashboard

**Job:** Tell the customer what they can do now and reassure them about money and recent orders.

Required layout:

- Greeting and contextual status.
- Wallet balance and fund wallet action.
- Quick actions: Buy data, Buy airtime, Track an order, Get help.
- Recent orders with delivery status.
- Failed or pending action alert.
- Recommended service or repeat purchase.
- Small “Become an agent” invitation, never the dominant content.

### Buy data

Flow:

1. Choose network.
2. Choose bundle.
3. Enter recipient number.
4. Review amount and delivery expectation.
5. Select wallet or mobile money.
6. Confirm.
7. Show order reference and tracking state.

Use a stepper on desktop and a bottom-sheet/step view on mobile. Clearly distinguish retail price, any discount, wallet balance, and amount due. Validate Ghanaian numbers, unsupported SIM types, and duplicate/retry situations.

### Buy airtime

Same purchase architecture as data, optimized for amount entry. Provide quick amount chips, custom amount, recipient number, network auto-detection with override, and clear receipt state.

### Results Checker

Required states:

- Product catalog and exam type.
- Available stock.
- Purchase confirmation.
- Voucher delivery.
- Reveal/copy voucher details.
- Order history and voucher status.
- Failed fulfillment and support action.

Never expose voucher secrets in a table without an explicit reveal action.

### AFA Registration

Flow:

- Explain AFA service and eligibility.
- Capture Ghana phone number, name, Ghana Card details, and consent.
- Validate input before submission.
- Show submitted, under review, approved, rejected, and needs correction states.
- Display current fee and payment status.
- Make privacy and identity handling language visible at the point of capture.

### Utilities & Bills

Include service tiles for electricity, water, TV, streaming, and other supported bills. Each flow should have account/meter number validation, amount, provider, beneficiary label, review, payment, and receipt.

### Wallet

Required:

- Available balance.
- Promotional credit separated from withdrawable cash.
- Fund wallet.
- Transaction list with filters.
- Transaction detail drawer.
- Payment pending/failed explanation.
- Download/share receipt.

### Orders

Use a filterable order list with service type, date, status, recipient, amount, and reference. Clicking an order opens a detail view with a delivery signal rail, timeline, payment record, retry/support action, and receipt.

### Profile and settings

Include:

- Personal details.
- Phone/email verification status.
- Password change.
- Notification preferences.
- Theme preference.
- Device/session management.
- Privacy and data export request.
- Account deletion request.

### Notifications

Group by Today, Earlier, and type. Support read/unread, delete, deep-linking to the relevant order, and notification preferences.

### Complaints

Use an inbox-like list with status, category, order reference, last update, and SLA indicator. Thread view should support replies, attachments, status transitions, and clear escalation.

### How-to Guides

Turn the guide library into searchable, categorized help content with progress tracking and contextual links from error states.

### What's New

Use a changelog feed with dates, categories, “new” markers, and detail pages. Keep it useful to customers and agents, not as a marketing blog.

---

## 7. Existing Agent Pages

### Agent Dashboard

**Job:** Show whether the agent is healthy, selling, and ready to act.

Include:

- Today/week/month sales.
- Available earnings and pending commission.
- Store health and completion checklist.
- Quick actions: share store, buy for customer, create campaign, withdraw.
- Top products and recent orders.
- Payout status.
- Referral progress.

### My Store

Use a builder layout:

- Left: settings and navigation.
- Center: live storefront preview.
- Right: publish/share checklist.

Sections:

- Store identity: name, handle, logo, colors, announcement.
- WhatsApp/contact channel.
- Network/product availability.
- Customer-facing pricing and margins.
- AFA and utility prices where relevant.
- Promo codes.
- Store status: Draft, Published, Paused.
- QR code and share kit.
- Preview as customer.

### Store Orders

Use a commerce operations table with source, customer, product, amount, margin, payment, delivery, and action. Detail view includes customer context, timeline, refund/retry controls, and communication actions.

### Agent pricing

Explain wholesale cost, recommended retail, current store price, minimum floor, and expected margin. Support bulk edits with a review step and an unsaved-changes indicator.

### Analytics

Include date range, sales trend, gross margin, product mix, network mix, repeat customers, conversion from storefront visits, and payout trend. Every chart needs an empty state and an accessible data table alternative.

### Earnings and commissions

Show earned, pending, paid out, referrals, overrides, and historical commission records. Make the calculation understandable with a detail drawer rather than hiding it behind a tooltip.

### Withdrawals

Flow:

- Available amount.
- Mobile money number/network/name.
- Minimum and fee information.
- Confirmation code step.
- Pending, approved, paid, rejected, and failed states.
- Withdrawal history and receipt.

### Customers

Add customer list, purchase history, total spend, last activity, consent status, notes/tags, and a customer detail view. This is also the audience source for bulk SMS.

### Bulk SMS

Use a campaign workflow:

- Choose audience.
- Compose message with live character/page count.
- Select sender ID.
- Review estimated cost and balance.
- Schedule/send.
- Monitor delivery results.

Add campaign drafts, templates, opt-out controls, delivery rate, and failure reasons.

### Community

Provide a moderated agent community link, onboarding resources, announcements, and contact/support routes. Do not present a social feed unless the product genuinely supports one.

### Agent failed beneficiaries

Give agents a clear list of failed numbers, reason, next action, and a way to correct and retry. Admin gets the wider tracker described below.

---

## 8. Existing Admin Pages

### Admin Overview

**Job:** Detect platform risk and prioritize work.

Include:

- Orders today, success rate, failed rate, revenue, payout exposure.
- Live operational alert strip.
- Order volume by network/service.
- Pending approvals.
- Failed beneficiaries.
- Unresolved complaints.
- Provider health and webhook freshness.
- Recent high-value or suspicious activity.

Do not use vanity metrics as the first content. The first viewport should answer: “Is the platform healthy, and what needs attention?”

### Order Monitor

Dense, filterable operations table with order ref, source, customer/agent, product, provider, amount, status, age, and actions. Support saved views, bulk selection, export, and detail drawer.

### Transactions

Financial ledger with immutable-looking records, source, debit/credit, actor, reference, timestamp, and reconciliation status. Include filters for provider, payment method, status, and date.

### Commissions

Show commission liability, agent earnings, overrides, tier bonuses, and payout reconciliation. Drill from a summary to agent and order level.

### Payouts

Queue-based review screen with risk context, amount, recipient, history, confirmation, approve/reject, and reason capture. Include batch approval only with strong review safeguards.

### Complaints

Support inbox with SLA, severity, assignment, category, customer/agent, order, and complete thread. Add internal notes and audit history.

### AFA operations

Review queue with identity data minimized by default, status, fee, payment, submitted date, correction request, approve/reject, and notification outcome.

### Result Checkers

Manage products, stock, fulfillment records, voucher inventory, provider status, and manual fulfillment workflow.

### SMS / Sender IDs

Approve sender IDs, inspect campaigns, monitor provider credit, delivery rates, compliance issues, and block/suspend actions.

### Beneficiary Tracker

Search failed numbers, failure reason, upstream status, retry history, correction action, and affected orders. Provide bulk import/export only with validation preview.
Search failed numbers, failure reason, upstream status, retry history, correction action, and affected orders. Provide bulk import/export only with validation preview.

### Agents

Agent directory with status, store status, sales, earnings, approval date, tier, risk flags, and detail view. Include onboarding completion and suspension controls.
Agent directory with status, store status, sales, earnings, approval date, tier, risk flags, and detail view. Include onboarding completion and suspension controls.

### Users

User management with role, verification, status, last active, account creation, wallet risk, and audit log. Destructive actions require explicit confirmation and reason.
User management with role, verification, status, last active, account creation, wallet risk, and audit log. Destructive actions require explicit confirmation and reason.

### Referrals and Tiers

Visualize referral funnel, tier rules, overrides, rewards, pending qualification, and program configuration with a change preview.
Visualize referral funnel, tier rules, overrides, rewards, pending qualification, and program configuration with a change preview.

### Admin Pricing

Use separate tabs for data bundles, checkers, AFA, SMS, and other products. Every edit shows effective date, current versus proposed value, validation, margin impact, and publish confirmation.
Use separate tabs for data bundles, checkers, AFA, SMS, and other products. Every edit shows effective date, current versus proposed value, validation, margin impact, and publish confirmation.

### Admin Notifications and Announcements

Compose announcements by audience, preview the message, schedule/publish, monitor reach, and audit edits. Distinguish operational alerts from product announcements.
Compose announcements by audience, preview the message, schedule/publish, monitor reach, and audit edits. Distinguish operational alerts from product announcements.

### Admin Settings

Add platform settings for providers, payment thresholds, supported networks, notification templates, roles, audit logs, feature flags, and maintenance mode.

---

## 9. Existing Public Agent Storefront

### Public agent storefront

**Job:** Convert a customer's intent into a completed purchase with minimal distraction.

Required storefront layout:

- Agent brand identity and trust markers.
- Network/service selector.
- Product cards with price and validity.
- Recipient number and validation.
- Cart or single-product checkout.
- Mobile money/payment selection.
- AFA registration form where enabled.
- Order confirmation with reference and track order.
- Track existing order action.
- Store announcement, WhatsApp, support, and legal links.

The storefront should feel independent but visibly powered by Smart Data Hub. It must load fast, work without an account, and handle not-found, paused, unavailable, and payment-pending states.

### Storefront additions

- Product search and “repeat this purchase”.
- Recent order lookup by reference and phone.
- Promo code entry with transparent discount.
- Network auto-detection with manual correction.
- Accessible receipt page that can be bookmarked.
- Offline-friendly retry messaging for weak connections.

---

## 10. Existing Mobile Experience

### Mobile experience

The final design should be a real responsive mobile product, not only a phone frame simulation. Preserve the phone-frame preview as a showcase/demo mode if useful, but the UI must also work at real mobile viewport sizes.

Mobile rules:

- Bottom navigation with 4-5 high-value destinations and a prominent buy action.
- Sheets for purchase, fund wallet, filters, and compact forms.
- Full-screen pages for checkout, order detail, profile, and support threads.
- Sticky amount/status summary above the keyboard where appropriate.
- Minimum 44px touch targets.
- Respect safe areas and keyboard movement.
- Use skeletons instead of blank panels.

---

## 11. New Screens Required For A Complete Product

These are recommended additions not fully represented in the current prototype.

### Account and trust

- Welcome/onboarding screen for first-time customers.
- Phone verification and email verification status pages.
- Device/session management.
- Security center with password, 2FA readiness, and recent activity.
- Account recovery confirmation.
- Privacy center and data export.

### Purchase and payments

- Universal checkout route shared by data, airtime, checker, AFA, and utilities.
- Payment method manager.
- Payment pending resolution page.
- Payment failure recovery page with retry/change-method actions.
- Receipt detail/download page.
- Order tracking public route.
- Refund/request-help flow.

### Agent growth

- Agent application status page.
- Agent onboarding checklist.
- Store publish readiness page.
- Promo code management page.
- Store insights detail page.
- Customer segmentation page.
- SMS templates page.
- Campaign detail and delivery report page.
- Payout account management page.
- Earnings statement/download page.

### Admin operations

- Global command/search page.
- Provider health dashboard.
- Webhook/event log viewer.
- Reconciliation workspace.
- Audit log explorer.
- Feature flag and maintenance mode screen.
- Role and permission editor.
- Notification template editor.
- Fraud/risk review queue.
- Incident center and post-incident notes.

### Content and support

- Help center index and article detail.
- Contact support wizard.
- Status page for provider/platform incidents.
- Changelog detail page.
- Legal document version archive.

---

## 12. Shared Component Inventory

Build these as reusable shadcn-style components, not one-off markup:

- AppShell, Sidebar, MobileBottomNav, Topbar, Breadcrumbs.
- CommandMenu and global search.
- WalletBalance, BalanceBreakdown, TransactionRow.
- NetworkBadge, ServiceIcon, ProductCard.
- OrderStatusBadge, DeliveryTimeline, OrderDetailDrawer.
- MoneyInput, PhoneInput, GhanaCardInput, AccountNumberInput.
- Stepper, ReviewSummary, PaymentMethodCard, Receipt.
- EmptyState, ErrorState, PageSkeleton, TableSkeleton.
- FilterBar, SavedViewMenu, DataTable, MobileRecordList.
- StatCard, TrendBadge, AreaChart, DonutChart, ChartLegend.
- ConfirmationDialog, DestructiveActionDialog, Toast, Sonner.
- StatusTimeline, AuditLog, ActivityFeed.
- StorePreview, PricingEditor, PromoCodeRow, ShareKit.
- SupportThread, MessageComposer, AttachmentPicker.
- AnnouncementComposer, AudiencePicker.

Every component needs loading, empty, error, disabled, focus, and mobile behavior where relevant.

---

## 13. Content and Interaction Rules

- Prefer “Buy data” to “Purchase data bundle”.
- Prefer “Money available” to “Available balance” when context is consumer-facing.
- Use “Delivered”, “Processing”, “Needs attention”, “Failed”, and “Refunded” consistently.
- Never say “Something went wrong” without an action or next step.
- Error copy should name the failed input or operation.
- Every money amount displays currency and uses consistent decimal rules.
- Every record with support value exposes its reference number.
- Confirmation actions use the final verb: “Pay GH₵20”, “Publish store”, “Approve payout”.
- Do not hide fees, margin, discount, or pending status.
- Empty states should explain why the list is empty and present one next action.

---

## 14. Accessibility and Quality Bar

- WCAG 2.2 AA target.
- Full keyboard navigation.
- Visible focus rings using `--ring`.
- Semantic headings and landmarks.
- `aria-live` for payment/order status changes.
- Color is never the only status indicator.
- Tables have accessible headers and a mobile alternative.
- All dialogs trap focus and close predictably.
- Form errors connect to fields and are announced.
- Respect reduced motion and contrast preferences.
- Test at 320px, 375px, 768px, 1024px, 1440px, and 1920px widths.
- Test long Ghanaian names, long order references, slow requests, provider failure, empty data, and duplicate clicks.

---

## 15. Route and State Acceptance Criteria

A generated implementation is complete when:

- A visitor can understand the product and reach a purchase from the public site.
- A customer can buy data, airtime, checkers, AFA, and utilities through consistent flows.
- A customer can see wallet, orders, receipts, notifications, complaints, profile, and help.
- An agent can publish a store, set prices, share it, receive orders, see earnings, manage customers, send SMS, and request withdrawals.
- An admin can monitor orders, reconcile money, review payouts, manage prices, users, agents, services, announcements, and complaints.
- A public storefront can complete guest checkout and track an order.
- The prototype runs as a standalone vanilla HTML/Tailwind CSS v4/JavaScript experience with no React or UI framework dependency.
- Tailwind CSS v4 is compiled through a minimal static build pipeline, and the browser-facing result does not require a runtime framework.
- The prototype uses the shadcn semantic theme contract: HSL CSS variables, `.dark` class theming, semantic surfaces, and consistent component variants.
- The prototype uses Bai Jamjuree consistently across headings, body copy, navigation, forms, tables, and marketing content.
- Browser back/forward, refresh, deep links, and direct entry into every primary screen work predictably.
- Every visible interactive element has a verified destination or visible state change; there are zero dead links or placeholder actions.
- Every async operation has loading, success, error, and retry states.
- The shell works on desktop and real mobile viewports.
- The design system is tokenized and consistent across all routes.
- No page looks like an isolated prototype. Navigation, copy, statuses, tables, forms, and receipts feel like one product.
- The interface feels premium through strong hierarchy, considered spacing, restrained decoration, polished micro-interactions, and realistic content rather than excessive gradients, cards, or animation.
- No page relies on repeated generic cards as its primary composition; each page has a deliberate information hierarchy and a clear focal task.

---

## 16. Suggested Build Order

1. Establish Tailwind CSS v4, shadcn-style semantic tokens, Bai Jamjuree typography, icons, vanilla equivalents of shadcn primitives, and app shells.
2. Build universal checkout, order status, wallet, receipt, and support patterns.
3. Redesign customer dashboard and buying flows.
4. Redesign public site and public storefront.
5. Build agent workspace, store builder, orders, earnings, and campaigns.
6. Build admin operations tables, detail drawers, pricing, payouts, and reports.
7. Add mobile responsive behavior and real mobile navigation.
8. Add missing trust, payment recovery, audit, provider health, and help screens.
9. Run visual QA at all target breakpoints and with realistic empty/error/loading states.
10. Verify that customer, agent, and administrator permissions are enforced securely in the production product and that preview/demo behavior cannot leak into real accounts.

---

## Final Direction

Smart Data Hub should not look like a generic African fintech landing page or an ordinary admin template. It should look like the product that keeps connectivity moving: a calm control room for agents and administrators, and a quick, confidence-building checkout for customers. Make the network signal rail the memory device, make money movement radically clear, use shadcn primitives with discipline, and let the quality come from hierarchy, state design, and operational detail.
