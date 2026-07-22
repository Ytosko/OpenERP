# Modular AI POS & Universal Print Designer
## Final Product and Engineering Handoff

---

# 1. Product Vision

Build an extremely simple, cloud-based POS and business platform centered around a powerful universal print designer.

The product must be easy enough for a third-grade student to understand and use without training.

The software should feel simple on the surface while remaining powerful underneath.

The user should be able to:

1. Create a store.
2. Add products.
3. Make a sale.
4. Choose a receipt or label.
5. Drag items onto a page.
6. Press Print.

The user must never need to understand:

- HTML
- CSS
- SQL
- JSON
- Printer commands
- Page coordinates
- Database relationships
- API keys
- Technical print terminology

The system handles those details automatically.

---

# 2. Product Definition

This product is not only a POS system.

It is a modular retail operating system with a reusable visual document and printing engine.

The POS uses the print engine for:

- Receipts
- Invoices
- Shipping labels
- Barcode labels
- Shelf labels
- Price tags
- Quotations
- Purchase orders
- Delivery notes
- Credit notes
- Customer statements
- Custom printable documents

The print engine must be a first-class independent module.

Other modules consume the print engine instead of implementing their own printing systems.

---

# 3. Core Product Priorities

Development priority must follow this order:

1. Universal Print Engine
2. Drag-and-Drop Print Designer
3. POS Checkout
4. Products and Inventory
5. Customers
6. Invoices and Payments
7. Reports
8. Suppliers and Purchasing
9. Advanced ERP Modules

The first production release must make printing and checkout excellent before adding complex ERP functionality.

---

# 4. Technology Stack

## Frontend

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Zustand for lightweight editor and POS state
- dnd-kit for simple drag-and-drop lists
- Moveable, Interact.js, or a custom canvas abstraction for free-position elements
- PDF.js only when PDF viewing is required

Deploy the frontend as a static Vite application on Coolify.

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

## Backend and Data

Use:

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- PostgreSQL functions
- Supabase RPC
- Supabase Edge Functions
- Redis only when required

## AI

Use Google Gemini for:

- Guided store setup
- Product category suggestions
- Product generation
- Receipt generation
- Label generation
- Layout suggestions
- Plain-language editing commands
- Help and onboarding

## ORM

Do not use Prisma.

Do not create:

- `schema.prisma`
- Prisma Client
- Prisma migrations
- Prisma adapters
- Prisma seed scripts

Use:

- Official Supabase JavaScript client
- SQL migrations
- PostgreSQL functions
- Supabase RPC

Drizzle may be introduced later only if it solves a clear server-side problem. It is not required for the MVP.

---

# 5. Deployment Architecture

Recommended production architecture:

```text
Vite React Static Frontend
          |
          +-- Supabase Auth
          +-- Supabase PostgreSQL
          +-- Supabase Storage
          +-- Supabase Realtime
          +-- PostgreSQL RPC
          +-- Supabase Edge Functions
          |       |
          |       +-- Gemini
          |       +-- Secure admin actions
          |       +-- Webhooks
          |       +-- Secret-dependent tasks
          |
          +-- Redis
                  |
                  +-- Rate limiting
                  +-- Queues
                  +-- Temporary cache
```

The Vite frontend must not require a permanent Node.js rendering server.

Coolify serves the generated static files.

---

# 6. Supabase Authentication

Supabase Auth is the only authentication provider.

Support:

- Email and password
- Email verification
- Forgot password
- Password reset
- Magic link
- OAuth providers when enabled
- Secure session refresh

Do not store passwords in application tables.

Use `auth.users` as the identity source.

Create a public `profiles` table for:

- Full name
- Avatar
- Phone
- Preferences
- Onboarding progress

---

# 7. Multi-Tenant Architecture

A user may create or join multiple Projects.

Each Project represents an isolated business.

Each project may contain:

- Stores
- Registers
- Warehouses
- Products
- Product categories
- Inventory
- Customers
- Suppliers
- Sales
- Invoices
- Payments
- Print templates
- Users
- Roles
- Settings

Every business table must contain `project_id`.

Tenant isolation must be enforced through PostgreSQL Row Level Security.

Client-side filtering alone is never sufficient.

Recommended roles:

- owner
- admin
- manager
- cashier
- inventory_manager
- accountant
- viewer

---

# 8. Simplicity Is a Product Requirement

The application must be easy enough for a third-grade student to operate.

This is not a marketing phrase. It is an engineering and design requirement.

## Simplicity Rules

Every screen should have one clear main task.

Use:

- Large buttons
- Clear icons
- Short labels
- Familiar words
- Guided steps
- Immediate visual feedback
- Safe defaults
- Undo
- Autosave
- Friendly error messages
- Big touch targets
- Consistent placement

Avoid:

- Technical words
- Crowded toolbars
- Hidden actions
- Long forms
- Large settings pages
- Unnecessary confirmation dialogs
- Exposing raw JSON
- Exposing coordinates
- Exposing database IDs
- Making users type exact printer dimensions unless they choose Custom Size

## Language Rules

Prefer:

- Add Product
- New Sale
- Print Receipt
- Change Size
- Move
- Copy
- Delete
- Undo
- Save
- Done

Avoid:

- Instantiate
- Configure schema
- Bind property
- Set data context
- Serialization
- RPC
- RLS
- Coordinate transform

Technical language may exist in developer documentation, but not in the normal user interface.

---

# 9. Beginner and Advanced Modes

The print designer should provide two editing modes.

## Easy Mode

Easy Mode is the default.

The user sees:

- A page
- A small list of common blocks
- Big Add buttons
- Simple style controls
- Clear Save and Print buttons

Easy Mode should hide:

- Exact X and Y coordinates
- Raw dimensions
- Layer IDs
- JSON
- Advanced conditional rules
- Custom expressions
- Technical printer settings

## Advanced Mode

Advanced Mode may expose:

- Exact position
- Exact size
- Layer order
- Rotation
- Conditional rules
- Data bindings
- DPI
- Bleed
- Safe area
- Custom variables
- Template JSON import/export
- Printer profiles

A user must explicitly switch to Advanced Mode.

Switching modes must never destroy the layout.

---

# 10. Core Universal Print Engine

The print engine is the centerpiece of the platform.

It must support unlimited templates per project.

## Supported Document Types

- POS receipt
- Sales invoice
- Quotation
- Purchase order
- Delivery note
- Credit note
- Customer statement
- Shipping label
- Barcode label
- QR label
- Shelf label
- Price tag
- Product label
- Custom document

## Supported Output Targets

- Browser preview
- Browser print
- PDF
- PNG
- Thermal printers
- Label printers
- A4 printers
- Letter printers
- Future ESC/POS output
- Future printer bridge application

The same template should render consistently across supported outputs.

---

# 11. Dynamic Page Size System

Users must be able to select a preset or create any custom page size.

## Built-In Presets

Include:

- 58 mm receipt
- 80 mm receipt
- 3-inch receipt roll
- 4 × 6-inch shipping label
- A4
- A5
- Letter
- Legal
- Common barcode labels
- Common shelf-label sizes

## Custom Size

Users may enter:

- Width
- Height
- Unit

Supported units:

- mm
- cm
- inch
- px

Example:

```text
Width: 4
Height: 6
Unit: inch
```

## Page Settings

Support:

- Width
- Height
- Top margin
- Right margin
- Bottom margin
- Left margin
- Portrait
- Landscape
- Fixed page
- Continuous roll
- Auto height
- Background color
- Transparent background
- Bleed
- Safe area
- DPI
- Grid size
- Snap strength

## Easy Size Selection

The user experience should be:

1. Choose what you are printing.
2. Choose a familiar size.
3. See the page immediately.
4. Start designing.

Example first question:

```text
What are you printing?

[Receipt] [Shipping Label] [Invoice] [Price Tag] [Custom]
```

Then:

```text
Choose a size

[58 mm] [80 mm] [4 × 6 inch] [A4] [Custom Size]
```

Do not begin with a complex form.

---

# 12. Continuous Roll Printing

For receipt printers, support continuous roll mode.

In continuous mode:

- Width is fixed.
- Height grows automatically.
- Content flows downward.
- The preview shows the estimated final length.
- The user may still set top, bottom, left, and right margins.
- Page breaks are not required unless explicitly enabled.

Examples:

- 58 mm receipt
- 80 mm receipt
- 3-inch roll

The engine must prevent content from being clipped at the paper edges.

---

# 13. Drag-and-Drop Print Designer

The visual designer should feel closer to Canva than a developer tool.

## Canvas

The canvas must show the selected page size accurately.

Support:

- Drag
- Drop
- Resize
- Select
- Multi-select
- Copy
- Paste
- Duplicate
- Delete
- Undo
- Redo
- Lock
- Unlock
- Group
- Ungroup
- Bring forward
- Send backward
- Bring to front
- Send to back
- Align
- Distribute
- Zoom
- Pan
- Grid
- Rulers
- Guides
- Snap to grid
- Snap to guides
- Snap to objects
- Keyboard movement
- Touch movement

## Simple Interaction

Clicking an element should show only the most useful controls.

Example for text:

```text
Text
Size
Bold
Align
Color
```

A More button may reveal advanced options.

Do not show 30 controls at once.

## Element Toolbar

Use a small floating toolbar near the selected element.

Example:

```text
[Move] [Copy] [Delete] [...]
```

---

# 14. Print Elements

Support reusable blocks.

## Basic Elements

- Text
- Rich text
- Image
- Logo
- Line
- Divider
- Rectangle
- Circle
- Shape
- Spacer

## Business Elements

- Store name
- Store logo
- Store address
- Customer details
- Supplier details
- Invoice number
- Date
- Time
- Cashier
- Register
- Product list
- Product table
- Quantity
- Unit price
- Discount
- Tax
- Subtotal
- Total
- Payment details
- Balance
- Change due
- Notes
- Terms
- Signature
- Page number

## Machine-Readable Elements

- QR code
- Code 128
- EAN-13
- UPC-A
- UPC-E
- Data Matrix
- PDF417
- Custom barcode

## Repeater Elements

Repeaters render lists such as:

- Invoice items
- Order items
- Payments
- Taxes
- Product labels
- Customer rows

Users should not need to understand loops.

The UI should say:

```text
Repeat this block for every item
```

---

# 15. Dynamic Data Bindings

Templates may contain dynamic values.

Examples:

```text
{{project.name}}
{{store.name}}
{{store.address}}
{{invoice.number}}
{{invoice.date}}
{{customer.name}}
{{cashier.name}}
{{item.name}}
{{item.quantity}}
{{item.unit_price}}
{{item.line_total}}
{{invoice.subtotal}}
{{invoice.tax_total}}
{{invoice.grand_total}}
{{payment.method}}
{{payment.change_due}}
```

The normal user interface must not require typing these variables.

Instead, provide a simple Insert Information menu:

```text
Add Information

Store Name
Customer Name
Invoice Number
Product List
Total
Tax
QR Code
```

Selecting an option inserts the correct binding automatically.

Advanced users may edit bindings directly.

---

# 16. Conditional Content

Support conditional visibility.

Examples:

- Show tax only when tax is greater than zero.
- Show discount only when a discount exists.
- Show customer details only when a customer is selected.
- Show a paid badge when balance is zero.
- Show page numbers only on multi-page documents.

Easy Mode should use plain-language rules:

```text
Show this only when:

[Tax is added]
```

Advanced Mode may expose a structured condition builder.

Do not require users to write code.

---

# 17. Template Management

Each project may have unlimited templates.

Support:

- Create
- Rename
- Duplicate
- Delete
- Archive
- Preview
- Test print
- Set as default
- Assign to store
- Assign to register
- Assign to document type
- Import JSON
- Export JSON
- Version history
- Restore previous version
- Draft and published states

## Default Template Rules

The system should support:

- Default receipt per project
- Default receipt per store
- Default receipt per register
- Default invoice
- Default shipping label
- Default product label

Specific settings override general settings.

---

# 18. Template Starter Gallery

Users should not have to design from zero.

Provide starter templates such as:

- Clean 58 mm receipt
- Clean 80 mm receipt
- Retail receipt
- Restaurant receipt
- VAT receipt
- 4 × 6 shipping label
- Simple A4 invoice
- Modern invoice
- Barcode sheet
- Shelf label
- Price tag

The first-time flow should recommend a template based on the user's business.

---

# 19. AI-Assisted Print Designer

Gemini should help users create and edit layouts using plain language.

Example prompts:

```text
Make me a clean 80 mm receipt with my logo, item list, VAT, total and QR code.
```

```text
Make the total bigger.
```

```text
Move the logo to the top.
```

```text
Add a thank-you message.
```

```text
Create a 4 × 6 shipping label.
```

The AI should return a structured template plan.

AI must not directly write unsafe HTML into the application.

All AI output must:

1. Use a strict JSON schema.
2. Pass Zod validation.
3. Be previewed.
4. Be reversible.
5. Be saved only after approval or explicit application.

Always provide Undo after an AI action.

---

# 20. Smart Onboarding

New users should complete onboarding in a few simple steps.

## Step 1: What do you sell?

Examples:

- Grocery
- Clothing
- Restaurant
- Pharmacy
- Electronics
- Services
- Other

## Step 2: Add your store

Ask only:

- Store name
- Country
- Currency
- Logo, optional

## Step 3: Choose a receipt

Show visual options.

Do not ask users to configure dimensions unless they choose Custom.

## Step 4: Add products

Offer:

- Add one
- Import file
- Use AI
- Skip for now

## Step 5: Make a test sale

Guide the user through one sale.

The full onboarding should feel like a game, not a setup form.

---

# 21. POS Module

The POS should be fast, touch-friendly, and keyboard-friendly.

## Main POS Screen

Include:

- Product search
- Barcode scanning
- Product category buttons
- Product grid
- Shopping cart
- Customer selection
- Quantity controls
- Discount controls
- Tax
- Hold sale
- Resume sale
- Checkout
- Print receipt

## Simplicity Rules

The cashier should primarily see:

- Products
- Cart
- Pay button

Advanced controls should stay hidden until needed.

## Checkout Flow

1. Add products.
2. Press Pay.
3. Choose payment method.
4. Enter amount if required.
5. Complete sale.
6. Print, download, or send receipt.

The flow should require as few taps as possible.

## Payments

Support:

- Cash
- Card
- Bank transfer
- Mobile payment
- Gift card
- Store credit
- Split payment
- Custom payment method

---

# 22. Inventory and ERP Support

The POS must integrate with inventory.

Support:

- Products
- Categories
- SKUs
- Barcodes
- Cost price
- Selling price
- Stock quantity
- Low-stock threshold
- Stores
- Warehouses
- Stock movements
- Stock adjustments
- Stock transfers
- Sales returns
- Purchase receipts

Use:

- `stock_movements` as the permanent inventory ledger
- `inventory_balances` as the current fast balance

Do not rely only on a mutable product quantity field.

---

# 23. Atomic Sale Completion

Completing a sale must happen through a PostgreSQL function called with Supabase RPC.

Recommended function:

```text
complete_sale(...)
```

It must atomically:

1. Validate the project and user.
2. Validate products.
3. Validate stock where required.
4. Create the invoice.
5. Create invoice items.
6. Record payments.
7. Create stock movements.
8. Update inventory balances.
9. Create an audit log.
10. Return the finished invoice.

If one step fails, no partial sale should remain.

---

# 24. Database Structure

Core tables:

- profiles
- projects
- project_members
- stores
- registers
- warehouses
- product_categories
- products
- inventory_balances
- stock_movements
- customers
- suppliers
- invoices
- invoice_items
- payments
- print_templates
- print_template_versions
- printer_profiles
- audit_logs

## Print Templates Table

Recommended structure:

```sql
create table public.print_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  register_id uuid references public.registers(id) on delete set null,

  name text not null,
  document_type text not null,

  page_mode text not null check (
    page_mode in ('fixed', 'continuous')
  ),

  width numeric(12,4) not null,
  height numeric(12,4),
  unit text not null check (
    unit in ('mm', 'cm', 'inch', 'px')
  ),

  margin_top numeric(12,4) not null default 0,
  margin_right numeric(12,4) not null default 0,
  margin_bottom numeric(12,4) not null default 0,
  margin_left numeric(12,4) not null default 0,

  orientation text not null default 'portrait',
  dpi integer not null default 96,

  background jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,

  status text not null default 'draft',
  is_default boolean not null default false,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Template Version Table

```sql
create table public.print_template_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid not null references public.print_templates(id) on delete cascade,
  version_number integer not null,
  layout jsonb not null,
  settings jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (template_id, version_number)
);
```

---

# 25. Template JSON Structure

Example:

```json
{
  "schemaVersion": 1,
  "page": {
    "mode": "fixed",
    "width": 4,
    "height": 6,
    "unit": "inch",
    "orientation": "portrait",
    "margins": {
      "top": 0.1,
      "right": 0.1,
      "bottom": 0.1,
      "left": 0.1
    },
    "dpi": 203
  },
  "editor": {
    "gridEnabled": true,
    "gridSize": 0.05,
    "snapEnabled": true
  },
  "elements": [
    {
      "id": "logo-1",
      "type": "image",
      "binding": "project.logo_url",
      "x": 0.5,
      "y": 0.2,
      "width": 3,
      "height": 0.7,
      "unit": "inch",
      "locked": false,
      "style": {
        "objectFit": "contain"
      }
    },
    {
      "id": "order-number",
      "type": "text",
      "binding": "invoice.number",
      "x": 0.2,
      "y": 1.1,
      "width": 3.6,
      "height": 0.3,
      "unit": "inch",
      "style": {
        "fontSize": 18,
        "fontWeight": 700,
        "textAlign": "center"
      }
    }
  ]
}
```

Users must never need to edit this JSON in Easy Mode.

---

# 26. Rendering Architecture

Create a shared rendering engine.

The editor, preview, PDF output, and print output must all use the same normalized template model.

Recommended internal flow:

```text
Template JSON
    |
    v
Normalize units and page settings
    |
    v
Resolve data bindings
    |
    v
Apply conditional visibility
    |
    v
Measure repeating and flowing content
    |
    v
Render to target
```

Targets:

- Editor canvas
- Browser preview
- Print HTML
- PDF
- Image
- Future native printer output

Avoid building a separate layout implementation for every output.

---

# 27. Coordinate and Unit Handling

Internally normalize physical dimensions to a single unit.

Recommended internal unit:

- CSS pixels at 96 DPI for editor calculations, or
- millimeters for physical print calculations

Conversions must be centralized.

Examples:

```text
1 inch = 25.4 mm
1 inch = 96 CSS pixels
```

Printer DPI must affect raster output, not the user's visual page size.

Do not scatter conversion formulas throughout components.

Create one tested unit-conversion module.

---

# 28. Safety and Print Accuracy

The designer should visually show:

- Page boundary
- Margin boundary
- Safe area
- Bleed area when enabled
- Clipped elements
- Overflow warnings

Warn users using simple language:

```text
This item is too close to the edge and may not print.
```

Do not show technical error codes.

Provide a Fix button where possible.

---

# 29. Autosave and Recovery

The editor must autosave.

Requirements:

- Save after a short idle delay.
- Show Saving...
- Show Saved.
- Keep local recovery state.
- Restore unsaved work after a crash.
- Save template versions at meaningful milestones.
- Provide Undo and Redo.
- Let users restore earlier versions.

The user should not lose work after accidentally closing the browser.

---

# 30. Accessibility and Device Support

The software must work on:

- Desktop
- Laptop
- Tablet
- Touchscreen POS terminal

The POS may support mobile screens for management, but the full designer may recommend tablet or desktop.

Requirements:

- Large touch targets
- Keyboard navigation
- Clear focus states
- Accessible labels
- Good contrast
- Screen-reader-friendly forms
- No color-only status indicators

---

# 31. Error Message Standard

Errors must be short, friendly, and actionable.

Bad:

```text
RPC transaction failed: P0001.
```

Good:

```text
This sale could not be completed because one item is out of stock.

[Review Item]
```

Bad:

```text
ValidationError: width must be numeric.
```

Good:

```text
Enter a page width, such as 4 inches.
```

---

# 32. Help System

Include contextual help.

Support:

- Small question-mark buttons
- Short tooltips
- Animated examples
- First-time hints
- Guided tours
- Searchable help
- Ask AI

The Ask AI button should answer questions such as:

```text
How do I make the logo bigger?
```

```text
How do I print a 4 × 6 label?
```

AI guidance must refer to actual buttons and screens in the product.

---

# 33. MVP Scope

The MVP should include:

## Foundation

1. Supabase authentication
2. Projects
3. Project switching
4. Project memberships
5. Roles
6. Row Level Security
7. Audit logs

## Print Engine

8. Template gallery
9. Fixed page sizes
10. Custom width and height
11. mm, cm, inch, and px
12. Custom margins
13. Continuous roll mode
14. Drag and drop
15. Resize
16. Duplicate
17. Delete
18. Undo and redo
19. Layers
20. Text
21. Images
22. Logo
23. Lines and shapes
24. Product list
25. Totals
26. QR codes
27. Barcodes
28. Dynamic bindings
29. Conditional visibility
30. Live preview
31. Browser print
32. PDF export
33. Template versions
34. Autosave
35. Test print
36. AI-generated layouts

## POS

37. Products
38. Categories
39. Barcode search
40. Cart
41. Customer selection
42. Discounts
43. Taxes
44. Payment methods
45. Sale completion RPC
46. Inventory deduction
47. Receipt selection
48. Receipt printing

## Basic Business Tools

49. Customers
50. Inventory balances
51. Stock adjustments
52. Low-stock alerts
53. Invoices
54. Payments
55. Basic dashboard

Do not add advanced accounting, payroll, manufacturing, or complex CRM to the first release.

---

# 34. Future Features

- ESC/POS output
- Local printer bridge
- Direct USB printer support
- Direct network printer support
- Offline-first POS
- Mobile application
- Restaurant table mode
- Kitchen display system
- Pharmacy mode
- Loyalty
- Gift cards
- Purchase orders
- Goods received
- Supplier payments
- Multi-currency
- Full accounting
- E-commerce integrations
- Online ordering
- Franchise management
- Public template marketplace
- Plugin system

---

# 35. Coolify Deployment

## Frontend

Deploy as a static Vite site.

Environment variables exposed to the browser:

```env
VITE_APP_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never expose:

```env
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
REDIS_PASSWORD=
```

Secrets belong in Edge Functions or private backend services.

## Optional Redis Service

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command:
      - redis-server
      - --appendonly
      - "yes"
      - --requirepass
      - ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Do not add Redis unless a real use case requires it.

---

# 36. Security Requirements

- Enable RLS on every tenant table.
- Never expose the service-role key.
- Validate all inputs with Zod.
- Validate all AI output.
- Sanitize user-provided rich text.
- Do not allow unrestricted custom JavaScript.
- Restrict custom HTML.
- Validate uploaded files.
- Use signed URLs for private assets.
- Use database transactions for sales and inventory.
- Rate-limit login and AI endpoints.
- Log privileged operations.
- Do not store payment-card data.
- Use a payment provider for card processing.

---

# 37. Testing Requirements

Include tests for:

- Unit conversion
- Page-size calculation
- Margin calculation
- Continuous page height
- Element positioning
- Element resizing
- Snap behavior
- Template serialization
- Template migrations
- Dynamic binding resolution
- Conditional visibility
- Repeater rendering
- PDF dimensions
- 4 × 6-inch output
- 58 mm output
- 80 mm output
- Sale completion
- Stock deduction
- RLS isolation
- Template permissions
- Autosave recovery

Add visual regression tests for common templates.

---

# 38. Explicit Instructions for AI Coding Agents

1. Use React, Vite, and TypeScript.
2. Do not use Next.js.
3. Do not use Prisma.
4. Use Supabase Auth.
5. Use Supabase PostgreSQL.
6. Use Supabase Storage.
7. Use Supabase RLS.
8. Use SQL migrations.
9. Use PostgreSQL RPC for atomic operations.
10. Keep the Vite frontend static.
11. Use Edge Functions for Gemini and secrets.
12. Make the universal print engine the core module.
13. Build Easy Mode before Advanced Mode.
14. Design for users with no technical knowledge.
15. Never require users to edit JSON.
16. Support fixed and continuous pages.
17. Support any custom width and height.
18. Support custom margins.
19. Support mm, cm, inch, and px.
20. Support drag, resize, duplicate, delete, align, and layer ordering.
21. Support dynamic data without requiring users to type variables.
22. Support QR codes and major barcode formats.
23. Support browser print and PDF export.
24. Use one shared rendering model.
25. Include autosave, Undo, and Redo.
26. Include template history.
27. Use plain-language error messages.
28. Keep screens focused on one main action.
29. Use large touch-friendly controls.
30. Hide advanced settings by default.
31. Add starter templates.
32. Add guided onboarding.
33. Validate AI output with Zod.
34. Never expose secrets in Vite.
35. Include production-ready error handling.
36. Include RLS and transaction tests.
37. Include README and Coolify deployment instructions.
38. Build the print designer and POS before advanced ERP modules.

---

# 39. Final Success Standard

The product is successful when a new user can:

1. Sign up.
2. Create a store.
3. Add a product.
4. Make a sale.
5. Choose a receipt.
6. Change the receipt size.
7. Drag the logo and total into place.
8. Press Print.

They should be able to do this without reading documentation or asking a developer.

The product must feel as simple as a child's drawing app, while supporting the accuracy and power required by real retail businesses.
