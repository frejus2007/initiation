/**
 * PIGHACK — Garde d'authentification (maquette statique)
 *
 * Pages publiques (pas de vérification) :
 *   bienvenue.html, connexion.html, inscription.html
 *
 * Toutes les autres pages vérifient sessionStorage.
 * La connexion/inscription posent le flag avant la redirection.
 */

(function () {
  "use strict";

  var SESSION_KEY = "pighack_session";
  var PERSISTENT_SESSION_KEY = "pighack_remembered_session";

  function readSession() {
    try {
      return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(PERSISTENT_SESSION_KEY);
    } catch (_) { return null; }
  }

  // Pages publiques : on ne vérifie pas
  var PUBLIC_PAGES = ["bienvenue.html", "connexion.html", "inscription.html"];
  var currentPage = window.location.pathname.split("/").pop() || "index.html";

  // ----- Logique de garde -----
  var isPublic = PUBLIC_PAGES.some(function (p) { return currentPage === p; });

  if (!isPublic) {
    var session = readSession();
    if (!session) {
      // Sauvegarder la page demandée pour y revenir après connexion
      sessionStorage.setItem("pighack_redirect", window.location.href);
      window.location.replace("connexion.html");
      return; // stopper le reste du script
    }
  }

  // ----- Soumission des formulaires d'auth -----
  var authForm = document.querySelector(".auth-form");
  if (authForm) {
    var message = document.getElementById("auth-message");
    var password = authForm.querySelector("[name=password]");
    var password2 = authForm.querySelector("[name=password2]");
    var rules = authForm.querySelector("[name=rules]");

    function showMessage(text) {
      if (!message) return;
      message.textContent = text;
      message.hidden = !text;
    }

    if (password && password2) {
      function checkPasswordMatch() {
        password2.setCustomValidity(password2.value && password.value !== password2.value ? "Les mots de passe ne correspondent pas." : "");
      }
      password.addEventListener("input", checkPasswordMatch);
      password2.addEventListener("input", checkPasswordMatch);
    }

    authForm.addEventListener("submit", function (e) {
      e.preventDefault();

      showMessage("");
      if (password && password2) {
        password2.setCustomValidity(password2.value !== password.value ? "Les mots de passe ne correspondent pas." : "");
      }
      if (!authForm.reportValidity()) return;
      if (rules && !rules.checked) {
        showMessage("Vous devez accepter les règles d’utilisation des laboratoires.");
        rules.focus();
        return;
      }

      // Lire le pseudonyme (inscription) ou l'email (connexion) comme nom d'affichage
      var pseudo = authForm.querySelector("[name=pseudo]");
      var email  = authForm.querySelector("[name=email]");
      var displayName = (pseudo && pseudo.value.trim()) ||
                        (email  && email.value.split("@")[0]) ||
                        "apprenant";

      // Poser la session
      var sessionValue = JSON.stringify({ name: displayName });
      sessionStorage.setItem(SESSION_KEY, sessionValue);
      var remember = authForm.querySelector("[name=remember]");
      try {
        if (remember && remember.checked) localStorage.setItem(PERSISTENT_SESSION_KEY, sessionValue);
        else localStorage.removeItem(PERSISTENT_SESSION_KEY);
      } catch (_) {}
      // Rediriger vers la page demandée avant connexion, ou l'accueil
      var target = sessionStorage.getItem("pighack_redirect") || "index.html";
      sessionStorage.removeItem("pighack_redirect");
      // N'autoriser que les destinations locales pour éviter les redirections externes.
      try {
        var parsed = new URL(target, window.location.href);
        if (parsed.origin !== window.location.origin) target = "index.html";
      } catch (_) { target = "index.html"; }
      window.location.replace(target);
    });
  }

  // ----- Boutons de déconnexion -----
  document.querySelectorAll("[data-action=logout]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      sessionStorage.removeItem(SESSION_KEY);
      try { localStorage.removeItem(PERSISTENT_SESSION_KEY); } catch (_) {}
      window.location.replace("connexion.html");
    });
  });

  // ----- Affichage du pseudonyme connecté -----
  var session = readSession();
  if (session) {
    try {
      var user = JSON.parse(session);
      document.querySelectorAll("[data-user-name]").forEach(function (el) {
        el.textContent = user.name;
      });

      var profileName = document.querySelector("#profile-pseudo");
      if (profileName) profileName.value = user.name || "";
    } catch (_) {}
  }

  var profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("profile-pseudo");
      var feedback = document.getElementById("profile-feedback");
      if (!input || !input.reportValidity()) return;
      var current = {};
      try { current = JSON.parse(readSession() || "{}"); } catch (_) {}
      current.name = input.value.trim();
      var value = JSON.stringify(current);
      sessionStorage.setItem(SESSION_KEY, value);
      try {
        if (localStorage.getItem(PERSISTENT_SESSION_KEY)) localStorage.setItem(PERSISTENT_SESSION_KEY, value);
      } catch (_) {}
      document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = current.name; });
      if (feedback) { feedback.textContent = "Pseudonyme enregistré dans cette maquette."; feedback.hidden = false; }
    });
  }
})();

