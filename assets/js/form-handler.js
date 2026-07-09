import { getState, log } from './app/core/state.js';

const FORM_CFG = {
  minSubmissionTime: 3000,
  placeholders: {
    institucional: "Describa los valores e identidad que desea proyectar...",
    medios: "Que objetivos de prensa busca alcanzar?",
    reputacion: "Describa la situacion actual de su marca...",
    crisis: "Describa brevemente la contingencia (confidencialidad garantizada)...",
    asuntos: "Que actores clave o marcos regulatorios desea abordar?",
    posicionamiento: "En que sector busca consolidar su autoridad?",
    contenidos: "Que tipo de activos narrativos requiere?",
    monitoreo: "Que canales o mercados especificos desea auditar?",
    default: "Contexto de su organizacion...",
  },
};

const ValidationRules = {
  email: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
  tel: (value) => /^\+?[\d\s\-()]{9,20}$/.test(value),
  required: (value) => value.trim().length > 0,
};

export function initializeFormHandler() {
  document.querySelectorAll('form[id]').forEach(formEl => {
    const { id } = formEl;
    if (!formEl || formEl.dataset.handlerAttached) return;

    formEl.dataset.handlerAttached = "true";
    formEl.noValidate = true;
    formEl._submissionData = { startTime: Date.now(), isHuman: false };

    const markHuman = () => {
      formEl._submissionData.isHuman = true;
    };
    ["mousemove", "keydown", "scroll", "touchstart"].forEach((eventName) => {
      window.addEventListener(eventName, markHuman, { once: true, passive: true });
    });

    const elements = {
      inputs: formEl.querySelectorAll("input, textarea, select"),
      messageField: formEl.querySelector('[id$="messageField"]'),
      btnText: formEl.querySelector('[id$="btnText"]'),
      btn: formEl.querySelector('button[type="submit"]'),
      spinner: formEl.querySelector('[id$="btnSpinner"]'),
    };

    const setError = (field, message) => {
      const error = document.getElementById(`${field.id}-error`);
      if (!error) return;
      error.textContent = message || "";
      error.classList.toggle("is-visible", Boolean(message));
      field.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const validateField = (field) => {
      if (field.type === "hidden" || field.name === "_honey") return true;
      if (field.closest(".hidden")) {
        setError(field, "");
        field.classList.remove("is-invalid", "is-valid");
        return true;
      }

      const value = field.value.trim();
      let message = "";

      if (field.required && !ValidationRules.required(value)) {
        message = "Este campo es obligatorio.";
      } else if (field.type === "email" && value && !ValidationRules.email(value)) {
        message = "Ingrese un email valido.";
      } else if (field.type === "tel" && value && !ValidationRules.tel(value)) {
        message = "Ingrese un telefono valido, con codigo de area.";
      }

      field.classList.toggle("is-invalid", Boolean(message));
      field.classList.toggle("is-valid", !message && value.length > 0);
      setError(field, message);
      return !message;
    };

    elements.inputs.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (!field.classList.contains("is-invalid")) return;
        validateField(field);
      });
    });

    formEl.addEventListener("change", (event) => {
      const target = event.target;
      if (!target.id || !target.id.endsWith("service")) return;

      const hasService = Boolean(target.value);
      elements.messageField?.classList.toggle("hidden", !hasService);

      const textarea = elements.messageField?.querySelector("textarea");
      if (!textarea) return;
      textarea.required = hasService;
      textarea.setAttribute("aria-required", hasService ? "true" : "false");
      textarea.placeholder = FORM_CFG.placeholders[target.value] || FORM_CFG.placeholders.default;
      validateField(textarea);
    });

    formEl.addEventListener("submit", async (event) => {
      event.preventDefault();

      const { isHuman, startTime } = formEl._submissionData;
      if (!isHuman || Date.now() - startTime < FORM_CFG.minSubmissionTime) {
        const { isStaging } = getState();
        if (isStaging) {
          log("Envío de formulario bloqueado: falta interacción humana o envío demasiado rápido.", { scope: "form_security" });
        }
        return;
      }

      let isValid = true;
      elements.inputs.forEach((field) => {
        if (!validateField(field)) isValid = false;
      });

      if (!isValid) {
        const firstInvalid = formEl.querySelector(".is-invalid");
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        window.showStatus?.("error", "Campos incompletos", "Revise los campos marcados antes de enviar.");
        return;
      }

      const formData = new FormData(formEl);
      if (formData.get("_honey")) return;

      const { formId, contactEmail } = getState();
      const endpoint = `https://formspree.io/f/${formId}`;
      const previousText = elements.btnText?.innerText || "Solicitar diagnostico";

      elements.btn.disabled = true;
      elements.btn.setAttribute("aria-busy", "true");
      elements.btn.classList.add("opacity-80", "cursor-not-allowed");
      if (elements.btnText) elements.btnText.innerText = "Enviando...";
      elements.spinner?.classList.remove("hidden");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          const data = await response.json();
          throw Error(data.error || `Error ${response.status}`);
        }

        if (typeof window.gtag === "function") {
          window.gtag("event", "generate_lead", {
            form_id: id,
            page_title: document.title,
            method: "Formspree",
          });
        }

        window.showStatus?.("success", "Enviado", "Consulta recibida. Le responderemos con proximos pasos claros.");
        formEl.reset();
        elements.messageField?.classList.add("hidden");
      } catch (error) {
        const message = error.message.includes("403")
          ? "El servidor de formularios rechazo la solicitud."
          : "No se pudo enviar la consulta.";
        log(error, { scope: "form_submit", endpoint });
        window.showStatus?.("error", "Error de envio", message);
      } finally {
        elements.btn.disabled = false;
        elements.btn.setAttribute("aria-busy", "false");
        elements.btn.classList.remove("opacity-80", "cursor-not-allowed");
        if (elements.btnText) elements.btnText.innerText = previousText;
        elements.spinner?.classList.add("hidden");
      }
    });
  });
}
