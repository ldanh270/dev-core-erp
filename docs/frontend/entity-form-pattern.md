# Blueprint: Frontend Entity Form Pattern (Full-Page CRUD)

> **Purpose:** This document specifies the architectural blueprint and UX guidelines for implementing CRUD (Create/Read/Update/Delete) interfaces for complex entities across the frontend.
> When implementing full-page CRUD forms (such as Salary Components or Employee profiles), adhere strictly to the conventions detailed herein.

---

## 1. Core Architectural Principles

- **Avoid Popup Dialogs/Sheets:** Do not use modal dialogs or sheet drawers for lengthy or complex multi-field entity forms.
- **View-State Switching:** Replace the list view with a dedicated full-page form view to provide an unconstrained, focused full-screen experience.
- **S.O.L.I.D Compliance:**
  - Form presentation and layout are isolated from business logic (SRP, OCP).
  - State management (`react-hook-form`), schema validation (Zod), and API mutations must reside in a dedicated custom hook.

---

## 2. Required Component Architecture

When implementing management features for an entity (e.g., `Department`, `Employee`, `Project`), construct three decoupled files:

### File 1: Hook Logic (`use-[entity]-form.ts`)

All form state, Zod validation schemas, mutation triggers, and error handling live here. Never couple raw mutation logic or schemas directly inside presentation files.

```typescript
// hooks/feature-name/use-entity-form.ts
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  /* schema definitions */
})

export function useEntityForm({ initialData, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      initialData ||
      {
        /* default empty values */
      },
  })

  const onSubmit = async (values) => {
    // Execute API mutation (Create or Update based on initialData presence)
    // Invoke onSuccess() callback upon completion
  }

  return { form, isPending, onSubmit: form.handleSubmit(onSubmit) }
}
```

### File 2: Form Presentation (`[entity]-form-page.tsx`)

Renders form sections wrapped within `<EntityFormPage>`. Structure form inputs into distinct logical card sections.

```typescript
// components/features/feature-name/entity-form-page.tsx
import { EntityFormPage } from "@/components/common/entity-form-page";
import { useEntityForm } from "@/hooks/feature-name/use-entity-form";
import { Form, FormField, FormItem, FormControl, Input } from "@/components/ui/form-ui";

export function EntityFormPage({ initialData, isReadOnly, onSuccess, onCancel, onEdit }) {
  const { form, isPending, onSubmit } = useEntityForm({ initialData, onSuccess });

  return (
    <EntityFormPage
      title={initialData ? "Edit Entity" : "Create Entity"}
      isReadOnly={isReadOnly}
      isPending={isPending}
      isDirty={form.formState.isDirty}
      formId="entity-form"  // Must match the id attribute of the <form> element
      onBack={onCancel}
      onSubmit={onSubmit}
      onEdit={onEdit}
    >
      <Form {...form}>
        <form id="entity-form" onSubmit={onSubmit} className="space-y-6">
          {/* Section 1 */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">General Information</h2>
            </div>
            <div className="p-6 space-y-6">
               {/* FormField components */}
            </div>
          </div>

          {/* Additional Sections... */}
        </form>
      </Form>
    </EntityFormPage>
  );
}
```

### File 3: Management Route (`[Entity]Management.tsx`)

Manages the view transition state between data table list view and full-page form views.

```typescript
// pages/feature-name/EntityManagement.tsx
import { useState } from "react";
import { EntityFormPage } from "@/components/features/feature-name/entity-form-page";

export default function EntityManagement() {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedItem, setSelectedItem] = useState<IEntity | null>(null);

  const handleCloseForm = () => {
    setView("list");
    setSelectedItem(null);
  };

  // Render Full-page Form when in create or edit view
  if (view !== "list") {
    return (
      <EntityFormPage
        initialData={selectedItem}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    );
  }

  // Default List View
  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Entity Management"
        actions={<Button onClick={() => setView("create")}>Add New</Button>}
      />
      {/* Data Table */}
    </div>
  );
}
```

---

## 3. Micro-Interaction Standards

To maintain enterprise-level UI consistency and polish:

1. **The Pill Rule:** All `<Input>`, `<SelectTrigger>`, and `<Button>` elements must include `rounded-full`.
2. **Container Geometry:** Form sections and card containers must use `rounded-xl`.
3. **Assisted Input Chips:** For complex strings (formulas, tokens, identifiers), render clickable pill badges (`rounded-full border bg-muted hover:bg-accent text-xs font-mono cursor-pointer`) to enable instant insertion without manual typing.
4. **No Heavy Modals:** Dialog modals or sliding sheets must not exceed one-third of viewport height or host nested tables/complex grids.
