
(function () {
  "use strict";

  var redirectUrl = "https://wallpaperaccess.com/full/3887227.jpg";

  // Detecta algumas situações comuns de abertura do DevTools.
  // É uma heurística, não uma detecção confiável.
  var threshold = 160;

  setInterval(function () {
    var widthDifference =
      window.outerWidth - window.innerWidth;

    var heightDifference =
      window.outerHeight - window.innerHeight;

    if (
      widthDifference > threshold ||
      heightDifference > threshold
    ) {
      window.location.replace(redirectUrl);
    }
  }, 1000);
})();
