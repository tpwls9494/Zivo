export interface FieldSelector {
  name?: string;          // input/select[name]
  id?: string;            // element[id]
  label?: string;         // label text (fuzzy match)
  placeholder?: string;   // input placeholder (fuzzy match)
  autocomplete?: string;  // [autocomplete] attribute
  elementType?: "input" | "select" | "button";
  buttonText?: string;    // button/label text to click (gender toggle)
  cssSelector?: string;   // arbitrary CSS selector as last resort
  value?: string;         // fixed value override (e.g. "male"/"female" for gender selects)
}
