/**
 * CTF ACADEMY BJ — Cyber Range v6 : Carte de Progression (Roadmap)
 * Interactions légères et centrage fluide sur l'étape active
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Si l'utilisateur clique sur un raccourci ou arrive sur la page,
    // on peut doucement faire défiler jusqu'à l'étape active si présent dans le hash
    var currentStage = document.querySelector(".stage-current");
    if (window.location.hash === "#en-cours" && currentStage) {
      currentStage.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
