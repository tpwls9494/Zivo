import { describe, it, expect, beforeEach, vi } from "vitest";

// Minimal re-implementation of autofill helpers for unit testing
// (avoids chrome runtime dependency in the main autofill.ts)

interface FieldSelector {
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
}

function findInput(sel: FieldSelector, root: Document | Element = document): HTMLInputElement | null {
  if (sel.name) {
    const el = root.querySelector<HTMLInputElement>(`input[name="${sel.name}"]`);
    if (el) return el;
  }
  if (sel.id) {
    const el = (root as Document).getElementById?.(sel.id) as HTMLInputElement | null;
    if (el?.tagName === "INPUT") return el;
  }
  if (sel.placeholder) {
    for (const input of root.querySelectorAll<HTMLInputElement>("input")) {
      if (input.placeholder?.toLowerCase().includes(sel.placeholder.toLowerCase())) return input;
    }
  }
  if (sel.label) {
    for (const label of root.querySelectorAll<HTMLLabelElement>("label")) {
      if (label.textContent?.includes(sel.label)) {
        const forId = label.htmlFor;
        if (forId) return (root as Document).getElementById?.(forId) as HTMLInputElement | null;
        return label.querySelector<HTMLInputElement>("input");
      }
    }
  }
  return null;
}

// --- Korean Air fixture ---
function buildKEForm(): HTMLElement {
  const form = document.createElement("form");
  form.innerHTML = `
    <input name="firstName" placeholder="" />
    <input name="lastName" placeholder="" />
    <input name="birthDate" type="date" />
    <input type="radio" id="genderMale" name="gender" value="M" />
    <input type="radio" id="genderFemale" name="gender" value="F" />
  `;
  document.body.appendChild(form);
  return form;
}

// --- JAL fixture ---
function buildJALForm(): HTMLElement {
  const form = document.createElement("form");
  form.innerHTML = `
    <input name="firstName" placeholder="Given Name" />
    <input name="lastName" placeholder="Family Name" />
    <input name="dateOfBirth" type="date" />
    <label>Date of Birth <input type="date" /></label>
  `;
  document.body.appendChild(form);
  return form;
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("findInput — name selector", () => {
  it("finds input by name", () => {
    buildKEForm();
    const input = findInput({ name: "firstName" });
    expect(input).not.toBeNull();
    expect(input?.name).toBe("firstName");
  });

  it("returns null when name does not match", () => {
    buildKEForm();
    expect(findInput({ name: "nonexistent" })).toBeNull();
  });
});

describe("findInput — id selector", () => {
  it("finds radio button by id", () => {
    buildKEForm();
    const radio = findInput({ id: "genderMale" });
    expect(radio).not.toBeNull();
    expect(radio?.id).toBe("genderMale");
  });
});

describe("findInput — placeholder selector", () => {
  it("finds input by partial placeholder match", () => {
    buildJALForm();
    const input = findInput({ placeholder: "Given Name" });
    expect(input).not.toBeNull();
  });

  it("is case-insensitive", () => {
    buildJALForm();
    expect(findInput({ placeholder: "given name" })).not.toBeNull();
  });
});

describe("findInput — label selector", () => {
  it("finds input inside label", () => {
    buildJALForm();
    const input = findInput({ label: "Date of Birth" });
    expect(input).not.toBeNull();
    expect(input?.type).toBe("date");
  });
});

describe("Korean Air selector map coverage", () => {
  it("all KE fields can be found in KE fixture", () => {
    buildKEForm();
    const KE = {
      given_name: { name: "firstName" },
      family_name: { name: "lastName" },
      birth_date: { name: "birthDate" },
      gender_M: { id: "genderMale" },
      gender_F: { id: "genderFemale" },
    };
    for (const [field, sel] of Object.entries(KE)) {
      expect(findInput(sel), `field ${field} not found`).not.toBeNull();
    }
  });
});

describe("JAL selector map coverage", () => {
  it("all JAL name/dob fields can be found in JAL fixture", () => {
    buildJALForm();
    const JL = {
      given_name: { name: "firstName", placeholder: "Given Name" },
      family_name: { name: "lastName", placeholder: "Family Name" },
    };
    for (const [field, sel] of Object.entries(JL)) {
      expect(findInput(sel), `field ${field} not found`).not.toBeNull();
    }
  });
});
