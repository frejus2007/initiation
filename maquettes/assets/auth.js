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

  // Maquette : navigation libre par défaut. Passer à true pour (ré)activer la protection.
  var REQUIRE_AUTH = false;

  // Pages publiques : on ne vérifie pas
  var PUBLIC_PAGES = ["bienvenue.html", "connexion.html", "inscription.html"];
  var currentPage = window.location.pathname.split("/").pop() || "index.html";

  // ----- Logique de garde -----
  var isPublic = PUBLIC_PAGES.some(function (p) { return currentPage === p; });

  if (REQUIRE_AUTH && !isPublic) {
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
      // Si inscription depuis inscription.html, activer l'animation de bienvenue lors de la première connexion
      if (currentPage === "inscription.html") {
        sessionStorage.setItem("pighack_first_login_anim", displayName);
        if (window.PigHackChallenges && window.PigHackChallenges.addUser) {
          window.PigHackChallenges.addUser({
            pseudo: displayName,
            email: (email && email.value.trim()) || (displayName + "@etudiant.bj"),
            role: "student",
            status: "active",
            points: 0,
            solvedCount: 0
          });
        }
      }

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
      sessionStorage.removeItem("pighack_first_login_anim");
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

  // ----- Animation de Bienvenue (Première connexion après Inscription) -----
  function showWelcomeModal(username) {
    var cleanName = String(username || "Apprenant").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
    var initial = cleanName.charAt(0).toUpperCase() || "P";

    var overlay = document.createElement("div");
    overlay.className = "welcome-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Bienvenue sur PIGHACK");

    overlay.innerHTML =
      '<div class="welcome-modal">' +
        '<div class="welcome-scan"></div>' +
        '<div class="welcome-header">' +
          '<div class="welcome-badge-icon" aria-hidden="true">' + initial + '</div>' +
          '<h2 class="welcome-title">Bienvenue dans l’arène, ' + cleanName + '&nbsp;!</h2>' +
          '<p class="welcome-sub">Votre compte PIGHACK est activé. Vous entrez dans la <strong>Phase d’initiation 2026</strong>.</p>' +
        '</div>' +
        '<div class="welcome-terminal" aria-hidden="true">' +
          '<div class="welcome-terminal-line l1"><span style="color:var(--signal)">[AUTH_OK]</span> Session sécurisée active. Matricule attribué.</div>' +
          '<div class="welcome-terminal-line l2"><span style="color:var(--success)">[CYBER_RANGE]</span> Environnements et conteneurs prêts.</div>' +
          '<div class="welcome-terminal-line l3"><span style="color:var(--brand)">[STANDARD]</span> Format officiel de validation : <strong style="color:var(--text)">PGH{...}</strong></div>' +
        '</div>' +
        '<div class="welcome-content">' +
          '<div class="welcome-features">' +
            '<div class="welcome-feat-item">' +
              '<span class="welcome-feat-icon" aria-hidden="true">🚩</span>' +
              '<div>' +
                '<div class="welcome-feat-title">Format des drapeaux imposé</div>' +
                '<div class="welcome-feat-desc">Chaque solution trouvée est de la forme <code>PGH{secret}</code>.</div>' +
              '</div>' +
            '</div>' +
            '<div class="welcome-feat-item">' +
              '<span class="welcome-feat-icon" aria-hidden="true">💻</span>' +
              '<div>' +
                '<div class="welcome-feat-title">Pratique directe sur terminal</div>' +
                '<div class="welcome-feat-desc">Manipulez vos propres commandes et conteneurs Docker locaux.</div>' +
              '</div>' +
            '</div>' +
            '<div class="welcome-feat-item">' +
              '<span class="welcome-feat-icon" aria-hidden="true">🎯</span>' +
              '<div>' +
                '<div class="welcome-feat-title">Premier objectif recommandé</div>' +
                '<div class="welcome-feat-desc">Démarrez le parcours Linux pour décrocher vos premiers <strong>50 points</strong>.</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="welcome-actions">' +
            '<button class="btn btn-ghost btn-sm" type="button" id="btn-welcome-dismiss">Explorer la plateforme</button>' +
            '<a class="btn btn-primary" href="parcours.html" id="btn-welcome-start">Lancer mon premier défi →</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Génération de confettis cyber animés
    var colors = ["#F15A38", "#F3B952", "#5CB88A", "#F3EFEA"];
    var modalEl = overlay.querySelector(".welcome-modal");
    for (var i = 0; i < 26; i++) {
      var confetti = document.createElement("div");
      confetti.className = "welcome-confetti";
      confetti.style.left = (Math.random() * 85 + 7) + "%";
      confetti.style.top = (Math.random() * 15 + 2) + "%";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = (Math.random() * 0.7) + "s";
      confetti.style.animationDuration = (Math.random() * 1.5 + 2.2) + "s";
      modalEl.appendChild(confetti);
    }

    setTimeout(function () {
      overlay.classList.add("is-visible");
    }, 60);

    function closeWelcome() {
      sessionStorage.removeItem("pighack_first_login_anim");
      overlay.classList.remove("is-visible");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 450);
    }

    var dismissBtn = overlay.querySelector("#btn-welcome-dismiss");
    var startBtn = overlay.querySelector("#btn-welcome-start");

    if (dismissBtn) dismissBtn.addEventListener("click", closeWelcome);
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        sessionStorage.removeItem("pighack_first_login_anim");
      });
    }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeWelcome();
    });
  }

  // Détection d'une première connexion venant de l'inscription
  var firstLoginUser = sessionStorage.getItem("pighack_first_login_anim");
  if (firstLoginUser) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        showWelcomeModal(firstLoginUser);
      });
    } else {
      showWelcomeModal(firstLoginUser);
    }
  }

  window.PigHackWelcome = { show: showWelcomeModal };
})();

