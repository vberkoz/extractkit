type CustomSelectOption = {
  label: string;
  value: string;
};

type CustomSelectConfig = {
  id: string;
  label: string;
  value: string;
  options: CustomSelectOption[];
};

export function renderCustomSelect(config: CustomSelectConfig): string {
  const menuId = `${config.id}-menu`;
  const labelId = `${config.id}-label`;
  const valueId = `${config.id}-value-label`;
  const selectedOption = config.options.find((option) => option.value === config.value) ?? config.options[0];

  return `
    <div class="custom-select" data-custom-select data-custom-select-id="${config.id}">
      <span class="custom-select-label" id="${labelId}">${escapeHtml(config.label)}</span>
      <input id="${config.id}-value" type="hidden" value="${escapeHtml(config.value)}" />
      <button
        id="${config.id}-trigger"
        class="custom-select-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="${menuId}"
        aria-labelledby="${labelId} ${valueId}"
      >
        <span id="${valueId}" class="custom-select-value">${escapeHtml(selectedOption?.label ?? config.value)}</span>
        <span class="custom-select-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false" aria-hidden="true">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </span>
      </button>
      <div id="${menuId}" class="custom-select-menu" role="listbox" hidden>
        ${config.options
          .map(
            (option) => `
              <button
                type="button"
                class="custom-select-option${option.value === config.value ? " is-active" : ""}"
                role="option"
                aria-selected="${String(option.value === config.value)}"
                data-custom-select-option
                data-value="${escapeHtml(option.value)}"
              >
                ${escapeHtml(option.label)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

export function initCustomSelects(): () => void {
  const controller = new AbortController();
  const selects = Array.from(document.querySelectorAll<HTMLElement>("[data-custom-select]"));

  for (const select of selects) {
    const trigger = select.querySelector<HTMLButtonElement>(".custom-select-trigger");
    const menu = select.querySelector<HTMLElement>(".custom-select-menu");
    const valueInput = select.querySelector<HTMLInputElement>('input[type="hidden"]');
    const valueLabel = select.querySelector<HTMLElement>(".custom-select-value");
    const optionButtons = Array.from(select.querySelectorAll<HTMLButtonElement>("[data-custom-select-option]"));

    if (!trigger || !menu || !valueInput || !valueLabel) {
      continue;
    }

    const sync = (value: string) => {
      valueInput.value = value;

      for (const optionButton of optionButtons) {
        const active = optionButton.dataset.value === value;
        optionButton.classList.toggle("is-active", active);
        optionButton.setAttribute("aria-selected", String(active));
      }

      const activeOption = optionButtons.find((optionButton) => optionButton.dataset.value === value);
      valueLabel.textContent = activeOption?.textContent?.trim() ?? value;
      trigger.setAttribute("aria-label", `${getSelectLabel(select)} ${valueLabel.textContent ?? ""}`.trim());
      valueInput.dispatchEvent(new Event("input", { bubbles: true }));
      valueInput.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const setExpanded = (expanded: boolean) => {
      trigger.setAttribute("aria-expanded", String(expanded));
      menu.hidden = !expanded;
      select.dataset.open = String(expanded);

      if (!expanded) {
        delete select.dataset.openDirection;
      } else {
        positionMenu(select, menu, trigger);
      }
    };

    const toggle = () => {
      setExpanded(menu.hidden);
      if (!menu.hidden) {
        const activeButton = optionButtons.find((optionButton) => optionButton.classList.contains("is-active"));
        activeButton?.focus();
      }
    };

    trigger.addEventListener(
      "click",
      () => {
        toggle();
      },
      { signal: controller.signal }
    );

    for (const optionButton of optionButtons) {
      optionButton.addEventListener(
        "click",
        () => {
          const nextValue = optionButton.dataset.value ?? "";
          sync(nextValue);
          setExpanded(false);
          trigger.focus();
        },
        { signal: controller.signal }
      );
    }

    trigger.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setExpanded(true);
          optionButtons[0]?.focus();
        }

        if (event.key === "Escape") {
          setExpanded(false);
        }
      },
      { signal: controller.signal }
    );

    menu.addEventListener(
      "keydown",
      (event) => {
        const currentIndex = optionButtons.findIndex((optionButton) => optionButton === document.activeElement);

        if (event.key === "Escape") {
          event.preventDefault();
          setExpanded(false);
          trigger.focus();
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          optionButtons[Math.min(currentIndex + 1, optionButtons.length - 1)]?.focus();
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          optionButtons[Math.max(currentIndex - 1, 0)]?.focus();
        }

        if (event.key === "Enter" || event.key === " ") {
          if (document.activeElement instanceof HTMLButtonElement) {
            document.activeElement.click();
          }
        }
      },
      { signal: controller.signal }
    );

    sync(valueInput.value || optionButtons[0]?.dataset.value || "");
  }

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      for (const select of selects) {
        if (select.contains(event.target)) {
          continue;
        }

        const trigger = select.querySelector<HTMLButtonElement>(".custom-select-trigger");
        const menu = select.querySelector<HTMLElement>(".custom-select-menu");

        if (trigger && menu) {
          trigger.setAttribute("aria-expanded", "false");
          menu.hidden = true;
          select.dataset.open = "false";
        }
      }
    },
    { signal: controller.signal }
  );

  const repositionOpenSelects = () => {
    for (const select of selects) {
      if (select.dataset.open !== "true") {
        continue;
      }

      const trigger = select.querySelector<HTMLElement>(".custom-select-trigger");
      const menu = select.querySelector<HTMLElement>(".custom-select-menu");

      if (trigger && menu) {
        positionMenu(select, menu, trigger);
      }
    }
  };

  window.addEventListener("resize", repositionOpenSelects, { signal: controller.signal });
  window.addEventListener("scroll", repositionOpenSelects, { signal: controller.signal, passive: true });

  return () => controller.abort();
}

function getSelectLabel(select: Element): string {
  return select.querySelector<HTMLElement>(".custom-select-label")?.textContent?.trim() ?? "";
}

function positionMenu(select: HTMLElement, menu: HTMLElement, trigger: HTMLElement): void {
  const triggerRect = trigger.getBoundingClientRect();
  const menuHeight = menu.getBoundingClientRect().height;
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const openUp = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow;

  select.dataset.openDirection = openUp ? "up" : "down";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
