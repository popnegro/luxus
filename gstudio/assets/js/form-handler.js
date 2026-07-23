/**
 * Luxus Consultores - Form Handler
 * Handles secure asynchronous contact form submissions with client-side validation,
 * loading states, and dynamic status alerts without page reloads.
 */

const FORM_CFG = {
  minSubmissionTime: 3000, // 3 seconds minimum to prevent spam bots
  placeholders: {
    institucional: "Describa los valores e identidad que desea proyectar...",
    medios: "¿Qué objetivos de prensa busca alcanzar?",
    reputacion: "Describa la situación actual de su marca...",
    crisis: "Describa brevemente la contingencia (Confidencialidad garantizada)...",
    asuntos: "¿Qué actores clave o marcos regulatorios desea abordar?",
    posicionamiento: "¿En qué sector busca consolidar su autoridad?",
    contenidos: "¿Qué tipo de activos narrativos (whitepapers, reportes) requiere?",
    monitoreo: "¿Qué canales o mercados específicos desea auditar?",
    default: "Contexto de su organización..."
  }
};

const ValidationRules = {
  email: (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
  tel: (val) => /^\+?[\d\s\-()]{9,15}$/.test(val.replace(/[\s\-()]/g, "")),
  required: (val) => val.trim().length > 0
};

window.initializeFormHandler = () => {
  const formsToInitialize = [
    { id: "contactForm", prefix: "" },
    { id: "leadForm", prefix: "lead-" }
  ];

  formsToInitialize.forEach((formMeta) => {
    const formElement = document.getElementById(formMeta.id);
    if (!formElement || formElement.dataset.handlerAttached) return;

    formElement.dataset.handlerAttached = "true";
    formElement._submissionData = { startTime: Date.now(), isHuman: false };

    // Human behavior detection to ward off naive automated bots
    const registerHumanInteraction = () => {
      formElement._submissionData.isHuman = true;
    };
    ["mousemove", "keydown", "scroll", "touchstart"].forEach((event) => {
      window.addEventListener(event, registerHumanInteraction, { once: true, passive: true });
    });

    const ui = {
      inputs: formElement.querySelectorAll("input, textarea, select"),
      messageField: document.getElementById(formMeta.prefix + "messageField"),
      btnText: formElement.querySelector(`#${formMeta.prefix}btnText`),
      btn: formElement.querySelector('button[type="submit"]'),
      btnSpinner: formElement.querySelector(`#${formMeta.prefix}btnSpinner`)
    };

    // Show/hide specific field errors in real time
    const toggleFieldError = (input, errorMessage) => {
      const errorParagraph = document.getElementById(`${input.id}-error`);
      if (errorParagraph) {
        errorParagraph.textContent = errorMessage || "";
        errorParagraph.classList.toggle("is-visible", !!errorMessage);
        input.setAttribute("aria-invalid", errorMessage ? "true" : "false");
      }
    };

    // Field-specific validation logic
    const validateField = (input) => {
      const value = input.value.trim();
      let errorMessage = "";

      if (input.required && !ValidationRules.required(value)) {
        errorMessage = "Este campo es obligatorio.";
      } else if (input.type === "email" && !ValidationRules.email(value)) {
        errorMessage = "Por favor, ingrese un email válido.";
      } else if (input.type === "tel" && !ValidationRules.tel(value)) {
        errorMessage = "Por favor, ingrese un número de teléfono válido (9 a 15 dígitos).";
      }

      input.classList.toggle("is-invalid", !!errorMessage);
      input.classList.toggle("is-valid", !errorMessage && value.length > 0);
      toggleFieldError(input, errorMessage);

      return !errorMessage;
    };

    // Register dynamic validation and input monitoring listeners
    ui.inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        validateField(input);
      });

      input.addEventListener("input", () => {
        if (input.classList.contains("is-invalid")) {
          toggleFieldError(input, "");
          input.classList.remove("is-invalid");
          input.setAttribute("aria-invalid", "false");
        }
      });
    });

    // Dynamic placeholder adjustments based on the selected service
    formElement.addEventListener("change", (e) => {
      if (e.target.id && e.target.id.endsWith("service")) {
        const selectedService = e.target.value;
        if (ui.messageField) {
          ui.messageField.classList.toggle("hidden", !selectedService);
          const textarea = ui.messageField.querySelector("textarea");
          if (textarea) {
            textarea.placeholder = FORM_CFG.placeholders[selectedService] || FORM_CFG.placeholders.default;
          }
        }
      }
    });

    // Handle form submit asynchronously
    formElement.addEventListener("submit", async (event) => {
      event.preventDefault();

      const { isHuman, startTime } = formElement._submissionData;
      
      // Reject if form is submitted too fast or without mouse/scroll interaction
      if (!isHuman || (Date.now() - startTime < FORM_CFG.minSubmissionTime)) {
        if (window.LUXUS_CONFIG?.isStaging) {
          window.showStatus?.("error", "Seguridad", "Falta interacción humana o envío excesivamente rápido.");
        }
        return;
      }

      // Perform validation across all form inputs
      let isFormValid = true;
      ui.inputs.forEach((input) => {
        if (!validateField(input)) {
          isFormValid = false;
        }
      });

      if (!isFormValid) {
        window.showStatus?.("error", "Campos Inválidos", "Por favor, complete todos los campos requeridos correctamente.");
        return;
      }

      const formData = new FormData(formElement);
      
      // Protect against simple bots using honeypot input field
      if (formData.get("_honey")) return;

      // Enable Loading States on submission button
      ui.btn.disabled = true;
      ui.btn.setAttribute("aria-busy", "true");
      ui.btn.classList.add("opacity-80", "cursor-not-allowed");

      const originalBtnText = ui.btnText ? ui.btnText.innerText : "ENVIAR";
      if (ui.btnText) {
        ui.btnText.innerText = "ENVIANDO...";
      }
      if (ui.btnSpinner) {
        ui.btnSpinner.classList.remove("hidden");
      }

      try {
        // Build JSON payload from FormData
        const payload = {};
        formData.forEach((value, key) => {
          payload[key] = value;
        });

        // Submit form data securely to our Node.js Express proxy endpoint
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}`);
        }

        // Trigger Google Analytics lead event if configured
        if (typeof window.gtag === "function") {
          window.gtag("event", "generate_lead", {
            form_id: formMeta.id,
            page_title: document.title,
            method: "Secure Express Proxy"
          });
        }

        // Display Success Status Toast and Reset Form (Without refreshing the page)
        window.showStatus?.("success", "Enviado", "Consulta recibida correctamente.");
        formElement.reset();
        
        // Hide message field upon reset
        if (ui.messageField) {
          ui.messageField.classList.add("hidden");
        }
        
        // Remove valid/invalid classes from elements
        ui.inputs.forEach((input) => {
          input.classList.remove("is-valid", "is-invalid");
        });

      } catch (err) {
        console.error("Form submission error:", err);
        window.showStatus?.(
          "error",
          "Error de Envío",
          err.message || "No se pudo enviar la consulta. Inténtelo nuevamente más tarde."
        );
      } finally {
        // Reset and restore the button states
        ui.btn.disabled = false;
        ui.btn.setAttribute("aria-busy", "false");
        ui.btn.classList.remove("opacity-80", "cursor-not-allowed");
        
        if (ui.btnText) {
          ui.btnText.innerText = originalBtnText;
        }
        if (ui.btnSpinner) {
          ui.btnSpinner.classList.add("hidden");
        }
      }
    });
  });
};
