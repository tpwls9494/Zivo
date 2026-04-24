import { describe, it, expect, beforeEach, vi } from "vitest";

// Minimal re-implementation of autofill helpers for unit testing
// (avoids chrome runtime dependency in the main autofill.ts)

interface FieldSelector {
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  cssSelector?: string;
  elementType?: "input" | "select";
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

// Extended helper that mirrors autofill.ts findElement — handles inputs AND selects
function findElement(sel: FieldSelector, root: Document | Element = document): HTMLElement | null {
  if (sel.cssSelector) {
    return root.querySelector<HTMLElement>(sel.cssSelector);
  }
  const elType = sel.elementType ?? "input";
  if (sel.name) {
    const el = root.querySelector<HTMLElement>(`${elType}[name="${sel.name}"]`);
    if (el) return el;
  }
  if (sel.label) {
    for (const label of root.querySelectorAll<HTMLLabelElement>("label")) {
      if (label.textContent?.includes(sel.label)) {
        const forId = label.htmlFor;
        if (forId) return (root as Document).getElementById?.(forId) ?? null;
        return label.querySelector<HTMLElement>("input, select");
      }
    }
  }
  if (sel.placeholder) {
    for (const input of root.querySelectorAll<HTMLInputElement>("input")) {
      if (input.placeholder?.toLowerCase().includes(sel.placeholder.toLowerCase())) return input;
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

// --- ANA fixture ---
function buildANAForm(): HTMLElement {
  const form = document.createElement("form");
  form.innerHTML = `
    <input autocomplete="given-name"  name="firstName"   placeholder="First name" />
    <input autocomplete="family-name" name="lastName"    placeholder="Last name" />
    <input autocomplete="tel"         name="phoneNumber" placeholder="Phone" />
    <label for="birthYear">Year</label>
    <select id="birthYear" name="birthYear">
      <option value="">--</option>
      <option value="1990">1990</option>
    </select>
    <label for="birthMonth">Month</label>
    <select id="birthMonth" name="birthMonth">
      <option value="">--</option>
      <option value="3">March</option>
      <option value="4">April</option>
    </select>
    <label for="birthDay">Day</label>
    <select id="birthDay" name="birthDay">
      <option value="">--</option>
      <option value="15">15</option>
    </select>
    <input type="radio" name="gender" value="M" />
    <input type="radio" name="gender" value="F" />
  `;
  document.body.appendChild(form);
  return form;
}

// --- Jeju Air fixture ---
function buildJejuAirForm(): HTMLElement {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>이름<input autocomplete="given-name"  placeholder="영문 이름" /></label>
    <label>성<input  autocomplete="family-name" placeholder="영문 성"   /></label>
    <label>휴대폰<input autocomplete="tel" placeholder="휴대폰" /></label>
    <select id="birthYear_0" name="birthYear">
      <option value="">년</option>
      <option value="1990">1990</option>
    </select>
    <select id="birthMonth_0" name="birthMonth">
      <option value="">월</option>
      <option value="3">3월</option>
    </select>
    <select id="birthDay_0" name="birthDay">
      <option value="">일</option>
      <option value="15">15일</option>
    </select>
    <input type="radio" name="gender" value="M" />
    <input type="radio" name="gender" value="F" />
  `;
  document.body.appendChild(form);
  return form;
}

describe("findElement — select by cssSelector", () => {
  it("finds select by id substring match", () => {
    buildANAForm();
    const el = findElement({ cssSelector: 'select[id*="birthYear"]', elementType: "select" });
    expect(el).not.toBeNull();
    expect(el?.tagName).toBe("SELECT");
  });

  it("finds select by name attribute", () => {
    buildANAForm();
    const el = findElement({ name: "birthMonth", elementType: "select" });
    expect(el).not.toBeNull();
    expect((el as HTMLSelectElement)?.name).toBe("birthMonth");
  });
});

describe("ANA selector map coverage", () => {
  it("given/family name and phone inputs are found", () => {
    buildANAForm();
    const fields = {
      given_name:  { name: "firstName",   placeholder: "First name" },
      family_name: { name: "lastName",    placeholder: "Last name" },
      phone:       { name: "phoneNumber", placeholder: "Phone" },
    };
    for (const [field, sel] of Object.entries(fields)) {
      expect(findInput(sel), `${field} not found`).not.toBeNull();
    }
  });

  it("birth year/month/day selects are found via cssSelector", () => {
    buildANAForm();
    const selects = {
      birth_year:  { cssSelector: 'select[id*="birthYear"],select[name*="birthYear"]',  elementType: "select" as const },
      birth_month: { cssSelector: 'select[id*="birthMonth"],select[name*="birthMonth"]', elementType: "select" as const },
      birth_day:   { cssSelector: 'select[id*="birthDay"],select[name*="birthDay"]',     elementType: "select" as const },
    };
    for (const [field, sel] of Object.entries(selects)) {
      expect(findElement(sel), `${field} not found`).not.toBeNull();
    }
  });

  it("gender radio buttons are found", () => {
    buildANAForm();
    const el = document.querySelector<HTMLInputElement>('input[type="radio"][value="M"]');
    expect(el).not.toBeNull();
  });
});

describe("Jeju Air selector map coverage", () => {
  it("given/family name inputs are found via label", () => {
    buildJejuAirForm();
    const fields = {
      given_name:  { label: "이름",  placeholder: "영문 이름" },
      family_name: { label: "성",    placeholder: "영문 성" },
    };
    for (const [field, sel] of Object.entries(fields)) {
      expect(findInput(sel), `${field} not found`).not.toBeNull();
    }
  });

  it("birth year select is found via cssSelector", () => {
    buildJejuAirForm();
    const el = findElement({
      cssSelector: 'select[id*="Year"],select[id*="year"],select[name*="birthYear"]',
      elementType: "select",
    });
    expect(el).not.toBeNull();
    expect(el?.tagName).toBe("SELECT");
  });

  it("phone input is found via label", () => {
    buildJejuAirForm();
    const el = findInput({ label: "휴대폰", placeholder: "휴대폰" });
    expect(el).not.toBeNull();
  });
});
