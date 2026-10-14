document.addEventListener("DOMContentLoaded", function() {
  const modal = document.getElementById("offer-modal");
  const showOfferBtn = document.getElementById("show-offer");

  if (showOfferBtn && modal) {
    showOfferBtn.disabled = false;
    showOfferBtn.addEventListener("click", function() {
      modal.style.display = "flex";
      setTimeout(function() {
        const trace = document.getElementById("trace");
        if (trace) {
          trace.style.width = "100%";
          setTimeout(function() {
            const step1 = document.getElementById("step1");
            const step2 = document.getElementById("step2");
            if (step1 && step2) {
              step1.style.opacity = "0";
              setTimeout(function() {
                step1.style.display = "none";
                step2.style.display = "flex";
              }, 400);
            }
          }, 1800);
        }
      }, 400);
    });
  }

  window.addEventListener("click", function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});