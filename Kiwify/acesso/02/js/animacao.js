(function () {
  "use strict";

  const SUCCESS_GIF_DURATION = 1500;
  const FAILED_GIF_DURATION = 1500;
  const BAR_DURATION = 900;
  const BORDER_DURATION = 700;

  const GREEN = "#4CAF50";
  const RED = "#F44336";
  const GRAY = "#E5E7EB";
  const WHITE = "#FFFFFF";
  const LABEL_GRAY = "#6B7280";

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  // Remove a borda CSS padrão do círculo.
  function removeStepBorder(circle) {
    if (!circle) return;

    circle.style.setProperty("border", "none", "important");
    circle.style.setProperty("outline", "none", "important");
    circle.style.setProperty("box-shadow", "none", "important");
  }

  // Cria ou recupera a linha de progresso.
  function createProgressLine(step) {
    let line = step.querySelector(".step-line");

    if (!line) {
      line = document.createElement("div");
      line.className = "step-line";
      step.appendChild(line);
    }

    line.style.display = "block";
    line.style.visibility = "visible";
    line.style.opacity = "1";
    line.style.background = GRAY;
    line.style.height = "4px";

    return line;
  }

  // Anima a barra de progresso de cinza para verde.
  function animateBar(line) {
    return new Promise(function (resolve) {
      if (!line) {
        resolve();
        return;
      }

      let startTime = null;

      line.style.display = "block";
      line.style.visibility = "visible";
      line.style.opacity = "1";
      line.style.background = GRAY;
      line.style.height = "4px";

      function frame(timestamp) {
        if (startTime === null) {
          startTime = timestamp;
        }

        const progress = Math.min(
          (timestamp - startTime) / BAR_DURATION,
          1
        );

        const percentage = progress * 100;

        line.style.background =
          "linear-gradient(to right, " +
          GREEN + " 0%, " +
          GREEN + " " + percentage + "%, " +
          GRAY + " " + percentage + "%, " +
          GRAY + " 100%)";

        if (progress < 1) {
          window.requestAnimationFrame(frame);
        } else {
          line.style.background = GREEN;
          resolve();
        }
      }

      window.requestAnimationFrame(frame);
    });
  }

  // Desenha a borda circular progressivamente.
  // O círculo fica branco assim que a animação começa.
  function animateStepBorder(step, color, duration) {
    const circle = step.querySelector(".step-circle");

    if (!circle) {
      return Promise.resolve();
    }

    const label = step.querySelector(".step-label");

    removeStepBorder(circle);

    circle.style.backgroundColor = WHITE;

    const previous = circle.querySelector(
      ".step-border-animation"
    );

    if (previous) {
      previous.remove();
    }

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");

    svg.setAttribute("viewBox", "0 0 36 36");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("step-border-animation");

    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "5";

    const ring = document.createElementNS(ns, "circle");

    ring.setAttribute("cx", "18");
    ring.setAttribute("cy", "18");
    ring.setAttribute("r", "16.5");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", color);
    ring.setAttribute("stroke-width", "2");

    const circumference = 2 * Math.PI * 16.5;

    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference);
    ring.style.strokeLinecap = "round";

    svg.appendChild(ring);
    circle.appendChild(svg);

    if (label) {
      label.style.transition = "color 300ms ease";
      label.style.color = LABEL_GRAY;
    }

    return new Promise(function (resolve) {
      const startTime = performance.now();

      function frame(timestamp) {
        const progress = Math.min(
          (timestamp - startTime) / duration,
          1
        );

        ring.style.strokeDashoffset = String(
          circumference * (1 - progress)
        );

        if (progress < 1) {
          window.requestAnimationFrame(frame);
        } else {
          ring.style.strokeDashoffset = "0";

          if (label) {
            label.style.color = color;
          }

          resolve();
        }
      }

      window.requestAnimationFrame(frame);
    });
  }

  // Exibe o GIF depois que a borda termina de ser desenhada.
  function showGif(step, type, index) {
    const circle = step.querySelector(".step-circle");
    const label = step.querySelector(".step-label");

    if (!circle) return;

    let gif = circle.querySelector(".step-gif");

    if (!gif) {
      gif = document.createElement("img");
      gif.className = "step-gif";
      gif.alt = "";
      circle.appendChild(gif);
    }

    const icon = circle.querySelector(
      "svg:not(.step-border-animation)"
    );

    gif.hidden = false;
    gif.style.display = "block";

    gif.src = type === "failed"
      ? "./images/failed.gif?step=" + index
      : "./images/success.gif?step=" + index;

    if (icon) {
      icon.style.display = "none";
    }

    circle.style.backgroundColor =
      type === "failed" ? RED : GREEN;

    removeStepBorder(circle);

    if (label) {
      label.style.color = LABEL_GRAY;
    }
  }

  // Restaura o estado inicial de um step.
  function resetStep(step) {
    const circle = step.querySelector(".step-circle");
    const label = step.querySelector(".step-label");

    if (circle) {
      circle.style.position = "relative";
      circle.style.backgroundColor = GRAY;

      removeStepBorder(circle);

      const icon = circle.querySelector(
        "svg:not(.step-border-animation)"
      );

      const gif = circle.querySelector(".step-gif");
      const border = circle.querySelector(
        ".step-border-animation"
      );

      if (icon) {
        icon.style.display = "block";
      }

      if (gif) {
        gif.style.display = "none";
        gif.hidden = true;
      }

      if (border) {
        border.remove();
      }
    }

    if (label) {
      label.style.color = LABEL_GRAY;
      label.style.transition = "color 300ms ease";
    }

    step.classList.remove("active");
  }

  // Executa toda a sequência de animações.
  async function initAnimation() {
    const tracker = document.querySelector(
      ".progress-tracker .tracker-steps"
    );

    if (!tracker) return;

    const steps = Array.from(
      tracker.querySelectorAll(".step-item")
    );

    if (steps.length < 4) return;

    // Mantém a seção ocupando seu espaço,
    // mas invisível até terminar o Step 3.
    const moreInformation = document.querySelector(
      "#more-information"
    );

    if (moreInformation) {
      moreInformation.classList.remove("visible");
    }

    // Todos começam cinza.
    steps.forEach(resetStep);

    const line1 = createProgressLine(steps[0]);
    const line2 = createProgressLine(steps[1]);

    // Não exibe uma linha depois do terceiro step.
    const thirdLine = steps[2].querySelector(".step-line");

    if (thirdLine) {
      thirdLine.style.display = "none";
    }

    // STEP 1 — Branco, borda verde e GIF de sucesso.

    steps[0].classList.add("active");

    await animateStepBorder(
      steps[0],
      GREEN,
      BORDER_DURATION
    );

    showGif(steps[0], "success", 1);

    await wait(SUCCESS_GIF_DURATION);

    await animateBar(line1);

    // STEP 2 — Branco, borda verde e GIF de sucesso.

    steps[1].classList.add("active");

    await animateStepBorder(
      steps[1],
      GREEN,
      BORDER_DURATION
    );

    showGif(steps[1], "success", 2);

    await wait(SUCCESS_GIF_DURATION);

    await animateBar(line2);

    // STEP 3 — Branco, borda vermelha e GIF de falha.

    steps[2].classList.add("active");

    await animateStepBorder(
      steps[2],
      RED,
      BORDER_DURATION
    );

    showGif(steps[2], "failed", 3);

    await wait(FAILED_GIF_DURATION);

    // A animação terminou.
    // A seção aparece suavemente, mantendo seu espaço.
    if (moreInformation) {
      moreInformation.classList.add("visible");
    }

    // STEP 4 — Continua cinza e sem animação.
  }

  // Inicializa quando o HTML estiver pronto.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initAnimation
    );
  } else {
    initAnimation();
  }
})();