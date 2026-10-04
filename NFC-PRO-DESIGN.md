# NFC PRO — Design System v0.1

## Product direction
Mobile-first management app for NFC plates, QR codes, clients and access analytics. The product should feel like a native Apple utility mixed with a restrained fintech dashboard: quiet, premium, practical and fast.

## Principles
- Mobile is the primary experience. Design at 390×844 first.
- Light theme is the default; dark mode is equally supported.
- One chromatic accent: blue.
- Structure with 1px borders and surface contrast before using shadows.
- Avoid AI-dashboard clichés: excessive glow, neon gradients, giant rounded cards, noisy charts and decorative glass everywhere.
- Information must be usable with one hand; primary touch targets should be around 44–52px.

## Core colors
### Light
- App background: `#F7F8FA`
- Surface: `#FFFFFF`
- Secondary surface: `#F1F3F5`
- Text: `#202020`
- Muted text: `#80858D`
- Border: `#E5E7EB`
- Primary blue: `#2563EB`
- Signal blue: `#3B82F6`
- Blue wash: `#EEF5FF`
- Success: `#25A35A`

### Dark
- App background: `#090A0C`
- Surface: `#111317`
- Secondary surface: `#171A1F`
- Text: `#F7F7F8`
- Muted text: `#8D939C`
- Border: `#24272D`
- Primary blue: `#3B82F6`
- Signal blue: `#60A5FA`

## Typography
Use the system Apple stack first: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, "Segoe UI", sans-serif`.
- Large page title: 30–38px, 700, tight tracking.
- Section title: 17px, 650–700.
- Body: 13–14px.
- Secondary/helper: 10–12px.
- Eyebrow: 10px, 700, uppercase, 0.18em tracking, blue.

## Shape language
- App cards: 15–18px radius.
- Inputs/buttons: 12–14px radius.
- Small icon containers: 12px radius.
- Bottom navigation: 22px radius.
- Pills only for statuses or true segmented chips; do not make every button fully pill-shaped.

## Elevation
- Default cards: no drop shadow, 1px border.
- Bottom navigation and floating action: soft shadow only.
- Modals/bottom sheets: backdrop blur + restrained elevation.

## Mobile app shell
- Sticky top bar around 66px.
- Content horizontal padding: 16px.
- Bottom navigation floats 10px from viewport sides/bottom and includes: Início, Clientes, centered +, Placas, Mais.
- The centered + opens a bottom sheet with Gerar QR, Nova placa, Novo cliente.
- Desktop becomes a left sidebar; do not redesign the mobile patterns into a separate visual language.

## Key screens
1. Home / Visão geral
2. Clientes
3. Placas
4. QR Studio
5. Link Generator / Google Business search
6. Analytics
7. Settings / Integrations

## QR Studio
Must feel like a focused editor, not a form page.
- Destination/link input first.
- Large live QR preview.
- Style segmented control.
- Color presets + custom color.
- Center logo selector.
- Export primary button.
- Secondary export options: SVG, PDF, 10×12 cm.
- Later: validate scannability before export.

## Do
- Reuse existing design tokens and components.
- Keep interfaces spacious but compact enough for one-handed use.
- Prefer native-feeling bottom sheets on mobile.
- Keep primary actions obvious and singular.
- Use subtle motion, 160–240ms.

## Don't
- Do not introduce new accent colors without updating this file.
- Do not add gradients to general UI chrome.
- Do not use large shadows on normal cards.
- Do not shrink touch targets to desktop sizes.
- Do not modify the app identity when implementing features.
