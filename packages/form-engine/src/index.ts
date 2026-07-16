import type { ApplicationQuestion, GroundedAnswer } from "@openjobagent/shared";

export type DetectedField = ApplicationQuestion & {
  selector: string;
  sensitive: boolean;
  submitControl: boolean;
};
const sensitivePattern =
  /(gender|race|ethnic|disability|veteran|religion|sexual|birth|ssn|nationality)/i;

function cssEscape(value: string): string {
  return globalThis.CSS?.escape
    ? globalThis.CSS.escape(value)
    : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function selectorFor(element: Element, index: number): string {
  if (element.id) return `#${cssEscape(element.id)}`;
  const name = element.getAttribute("name");
  if (name) return `[name="${name.replaceAll('"', '\\"')}"]`;
  return `[data-openjobagent-index="${index}"]`;
}

function labelFor(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  const aria = element.getAttribute("aria-label") ?? element.getAttribute("aria-labelledby");
  if (aria) return aria;
  if (element.id) {
    const explicit = element.ownerDocument.querySelector(`label[for="${cssEscape(element.id)}"]`);
    if (explicit?.textContent?.trim()) return explicit.textContent.trim();
  }
  const parent = element.closest("label");
  return (
    parent?.textContent?.trim() ||
    element.getAttribute("placeholder") ||
    element.name ||
    "Unlabelled field"
  );
}

export function extractVisibleFields(document: Document): DetectedField[] {
  const elements = [
    ...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    ),
  ];
  return elements.flatMap((element, index) => {
    if (
      element instanceof HTMLInputElement &&
      ["hidden", "submit", "button", "reset", "image"].includes(element.type)
    )
      return [];
    if (element.disabled || element.getAttribute("aria-hidden") === "true") return [];
    element.setAttribute("data-openjobagent-index", String(index));
    const text = labelFor(element).replace(/\s+/g, " ").trim();
    const options =
      element instanceof HTMLSelectElement
        ? [...element.options].map((option) => option.text.trim()).filter(Boolean)
        : undefined;
    return [
      {
        id: element.id || element.name || `field-${index}`,
        text,
        fieldType:
          element instanceof HTMLTextAreaElement
            ? "textarea"
            : element instanceof HTMLSelectElement
              ? "select"
              : element.type,
        required: element.required,
        minLength: "minLength" in element && element.minLength >= 0 ? element.minLength : undefined,
        maxLength: "maxLength" in element && element.maxLength >= 0 ? element.maxLength : undefined,
        options,
        selector: selectorFor(element, index),
        sensitive: sensitivePattern.test(text),
        submitControl: false,
      },
    ];
  });
}

export function fillField(
  document: Document,
  field: DetectedField,
  result: GroundedAnswer,
): boolean {
  if (
    field.sensitive ||
    field.submitControl ||
    result.status !== "ready" ||
    result.answer === undefined
  )
    return false;
  const element = document.querySelector<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(field.selector);
  if (
    !element ||
    (element instanceof HTMLInputElement && ["file", "submit"].includes(element.type))
  )
    return false;
  if (element instanceof HTMLSelectElement) {
    const option = [...element.options].find(
      (entry) => entry.value === result.answer || entry.text.trim() === result.answer,
    );
    if (!option) return false;
    element.value = option.value;
  } else if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) {
    if (!/^(true|yes|1|checked)$/i.test(result.answer)) return false;
    element.checked = true;
  } else element.value = result.answer;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export function pageMetadata(document: Document, url: string) {
  const jobTitle = document.querySelector("[data-job-title], h1")?.textContent?.trim() ?? "";
  const company = document.querySelector("[data-company], .company")?.textContent?.trim() ?? "";
  const description =
    document
      .querySelector("[data-job-description], .job-description, main")
      ?.textContent?.trim()
      .slice(0, 100_000) ?? "";
  return { jobTitle, company, description, url };
}

export function canAutoSubmit(
  policy: "fill_only" | "review_before_submit" | "auto_submit_allowlisted",
  adapterAllowlisted: boolean,
): boolean {
  return policy === "auto_submit_allowlisted" && adapterAllowlisted;
}
