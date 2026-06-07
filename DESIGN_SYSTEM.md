# Belarro — Design System & UI Standards

**Version:** 1.0  
**Last Updated:** May 24, 2026  
**Status:** Production Standard

---

## 1. Color Palette

### Primary Colors
- **Green (Active/Success):** `#10B981` — used for active status, success buttons, primary actions
- **Blue (Info/Edit):** `#3B82F6` — used for edit/info buttons, secondary actions
- **Yellow (Warning/Paused):** `#F59E0B` — used for paused status, warnings
- **Red (Critical/Delete):** `#DC2626` — used for delete, errors, critical alerts

### Neutral Colors
- **Dark Gray (Text):** `#111827` — primary text, labels, headings
- **Medium Gray (Secondary Text):** `#4B5563` — secondary labels, helper text
- **Light Gray (Borders):** `#D1D5DB` — borders, dividers, input borders
- **Very Light Gray (Backgrounds):** `#F9FAFB` — card backgrounds, input backgrounds
- **White:** `#FFFFFF` — main background

### Status Badge Colors

| Status | Background | Text | Usage |
|--------|-----------|------|-------|
| Active | `#D1FAE5` | `#065F46` | Active crops, customers, orders |
| Paused | `#FEF3C7` | `#92400E` | Paused items |
| Inactive | `#F3F4F6` | `#374151` | Inactive items |
| Prospect | `#DDD6FE` | `#4C1D95` | New customer prospects |

---

## 2. Typography

### Font Family
- **System Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- No external fonts (use system defaults for performance)

### Font Sizes & Weights

| Type | Size | Weight | Usage |
|------|------|--------|-------|
| **Page Title** | 28px | 700 (bold) | H1 — page headers |
| **Section Title** | 18px | 600 | Card titles, section headings |
| **Label** | 13px | 700 | Form labels, field labels |
| **Body Text** | 13px | 400 | Default body text |
| **Small Text** | 12px | 500 | Secondary info, table data |
| **Tiny Text** | 11px | 500 | Helper text, badges |

### Color Contrast Rules (WCAG AA)
- **All text must have 4.5:1 contrast ratio minimum** against its background
- **Labels:** Always `color: '#111827'` (dark gray on light/white backgrounds)
- **Input fields:** Always `color: '#111827'` on white background
- **Disabled text:** `color: '#9CA3AF'` only when truly disabled
- **NO placeholder-like contrast** — all text must be fully readable

---

## 3. Spacing System

All spacing uses 4px base unit (multiples of 4):
- **4px** — micro spacing (gaps between small elements)
- **8px** — small spacing (padding in buttons, badges)
- **12px** — default spacing (padding in cards, gaps between form fields)
- **16px** — medium spacing (padding in modals, section gaps)
- **24px** — large spacing (gaps between major sections)
- **32px** — extra-large spacing (page margins)

### Application
- **Cards:** `padding: 20px` (5×4)
- **Form fields:** `marginBottom: 16px` (4×4)
- **Buttons:** `padding: 10px 16px` with `minHeight: 44px`
- **Section gaps:** `gap: 24px` (6×4)

---

## 4. Components

### Buttons

#### Primary Action Button (Green)
```
backgroundColor: '#10B981'
color: 'white'
padding: '10px 16px'
minHeight: '44px'
border: 'none'
borderRadius: '6px'
fontSize: '14px'
fontWeight: '600'
cursor: 'pointer'
```
**Usage:** "+ New Item", "Create", "Submit"

#### Edit Button (Blue)
```
backgroundColor: '#DBEAFE'
border: '1px solid #0284C7'
color: '#0C4A6E'
padding: '10px'
minHeight: '44px'
borderRadius: '6px'
fontSize: '13px'
fontWeight: '600'
cursor: 'pointer'
```
**Icon:** ✎ (pencil)

#### Pause/Resume Button (Yellow)
```
backgroundColor: active ? '#FCD34D' : '#86EFAC'
color: active ? '#92400E' : '#166534'
border: 'none'
padding: '10px'
minHeight: '44px'
borderRadius: '6px'
fontSize: '13px'
fontWeight: '600'
cursor: 'pointer'
```
**Icons:** ⏸ (pause) or ▶ (play)

#### Delete Button (Red)
```
backgroundColor: '#FCA5A5'
color: '#7F1D1D'
border: 'none'
padding: '10px'
minHeight: '44px'
borderRadius: '6px'
fontSize: '13px'
fontWeight: '600'
cursor: 'pointer'
```
**Icon:** 🗑 (trash)

### Form Inputs

#### Text Input / Textarea / Select
```
width: '100%'
padding: '10px'
border: '2px solid #D1D5DB'
borderRadius: '6px'
fontSize: '13px'
color: '#111827'
backgroundColor: '#FFFFFF'
boxSizing: 'border-box'
```
- Focus state: `border: '2px solid #3B82F6'`
- Error state: `border: '2px solid #DC2626'`

#### Form Label
```
display: 'block'
fontSize: '13px'
fontWeight: '700'
marginBottom: '8px'
color: '#111827'
```

### Cards

#### Standard Card
```
backgroundColor: 'white'
borderRadius: '8px'
border: '1px solid #E5E7EB'
overflow: 'hidden'
boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
padding: '20px'
```

#### Card with Info Section
```
backgroundColor: '#F9FAFB'
borderRadius: '6px'
padding: '12px'
border: 'none'
```
**Used for:** Growth Days, Yield/Tray, Inventory stats

### Badges

#### Status Badge
```
display: 'inline-block'
backgroundColor: [STATUS_COLOR]
color: [STATUS_TEXT]
padding: '4px 12px'
borderRadius: '12px'
fontSize: '12px'
fontWeight: '600'
textTransform: 'capitalize'
```

#### Tag/Pill Badge (Variant)
```
backgroundColor: '#E0F2FE'
border: '1px solid #0284C7'
color: '#0C4A6E'
padding: '8px 12px'
borderRadius: '6px'
fontSize: '12px'
fontWeight: '600'
```

---

## 5. Layout Grid

### Desktop
- **3-column grid** for cards (crops, customers, standing orders)
- **Full-width table** for data-heavy pages (orders, inventory)
- Responsive: `gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'`

### Tablet
- **2-column grid** (auto-adjust via minmax)

### Mobile
- **1-column grid** (auto-adjust via minmax)

### Modals
- **Right-side slide panel** (500px max-width)
- `position: 'fixed'`, `inset: 0`, `justifyContent: 'flex-end'`
- Scrollable content area with fixed footer

---

## 6. Accessibility Standards (WCAG AA)

### Contrast Requirements
✅ All text: 4.5:1 minimum on backgrounds  
✅ All buttons/interactive: 44px minimum touch target  
✅ Focus states: Visible 2px border on all interactive elements  

### Requirements Applied to ALL Pages
- Labels always dark (`#111827`)
- Input fields always readable on white
- No placeholder-only form fields
- All buttons have clear, visible text + icons where helpful
- All colors have sufficient contrast

---

## 7. Page Structure Template

```
Layout
├── Header (Title + "+ New" Button)
├── Status Tabs (with counts)
├── Content
│   ├── Cards Grid (crops, customers, standing orders)
│   ├── Data Table (orders, inventory)
│   └── Summary Cards (inventory)
└── Modal (Create/Edit form)
    ├── Title
    ├── Form fields (all with labels)
    ├── Builder sections (growth steps, items, variants)
    └── Actions (Cancel + Create/Update)
```

---

## 8. Form Input Pattern

**EVERY form field must follow this pattern:**

```tsx
<div>
  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>
    Field Name *
  </label>
  <input
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    style={{
      width: '100%',
      padding: '10px',
      border: '2px solid #D1D5DB',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#111827',
      backgroundColor: '#FFFFFF',
      boxSizing: 'border-box',
    }}
    required
  />
</div>
```

---

## 9. Enforcement Checklist

**Before shipping ANY page or feature:**

- [ ] All text is readable (test on phone with brightness at 50%)
- [ ] All labels are dark (`#111827`) and bold (weight 700)
- [ ] All input fields have 2px borders and white backgrounds
- [ ] All buttons have clear icons + text
- [ ] All buttons are min 44px tall
- [ ] No gray text on light backgrounds (except disabled states)
- [ ] All status badges use correct colors
- [ ] Modal inputs follow form input pattern exactly
- [ ] Tested on desktop, tablet, mobile

---

## 10. Business Logic: Orders Model

**Default Behavior:** ALL orders are RECURRING (weekly subscription)
- Customer places order → automatically repeats every week
- Farm delivers same crop/qty every Monday (or configured day)
- Continue until customer cancels/pauses

**One-Time Exception:** Checkbox: "This is a one-time order"
- Customer needs crop for just one specific week
- No automatic repeat after first delivery
- Then order ends

**Order Table Display:**
- 🔄 Weekly badge = recurring (green)
- ⏱ One-time badge = single delivery only (red)

**Standing Orders:** REMOVED (redundant)
- Orders now handle both recurring and one-time
- No separate "Standing Orders" feature needed
- Simpler architecture

---

## 11. Files That MUST Follow This System

- `src/app/crops/page.tsx`
- `src/app/customers/page.tsx`
- `src/app/orders/page.tsx` ← **Recurring by default + one-time toggle**
- `src/app/inventory/page.tsx`
- Any future pages added to the project

**Note:** Standing Orders page should be removed from navigation

---

**Last updated:** May 24, 2026  
**Approved by:** Industry standard compliance  
**Maintained by:** Design system team
