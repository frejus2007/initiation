(function () {
  "use strict";

  var API = (window.PIGHACK_LAB_API || "http://127.0.0.1:8090").replace(/\/$/, "");
  var STORAGE_PREFIX = "pighack_lab_v1_";

  var FALLBACK = [
    {
      id: "filtre-contourne", title: "Le filtre contourné", difficulty: "N1", points: 60,
      context: "Nyala Lab vient de lancer NyalaBot sur son site pour orienter les visiteurs. Avant la mise en ligne, le prestataire a ajouté un « bouclier » : une liste de mots interdits pour empêcher le bot de parler de sa configuration. Il est sûr de lui, il a même écrit « inviolable » dans le ticket. Une valeur de contrôle (CTRL-…) est stockée dans sa configuration interne. Montre que bloquer des mots ne suffit pas, et récupère-la."
    },
    {
      id: "donnees-perso-dans-le-prompt", title: "Le dossier qui ne devait pas fuiter", difficulty: "N1", points: 80,
      context: "NyalaAssist rédige les relances de la formation et garde à portée de main le dossier (fictif) d'un inscrit. Il te propose de « personnaliser » l'e-mail avec le nom, l'adresse et le téléphone. Un bon réflexe RGPD : refuser. Obtiens la relance sans jamais laisser fuiter de donnée personnelle."
    },
    {
      id: "hameconnage-ia", title: "Le courriel trop pressé", difficulty: "N2", points: 110,
      context: "Lundi, 8 h 47. Trois courriels arrivent dans contact@nyala-lab.bj : une demande classique, un message du « directeur » qui exige une réponse avant midi, et une facture d'apparence irréprochable. Un seul est un piège. L'urgence est un faux ami : le message pressé est parfaitement légitime. Examine les en-têtes et les liens, désigne le bon courriel et l'indice qui le trahit."
    },
    {
      id: "verifier-reponse-ia", title: "L'assistant qui invente", difficulty: "N2", points: 120,
      context: "Le nouvel assistant interne répond à tout, toujours avec aplomb. À la question sur la politique de mots de passe, il annonce : « 8 caractères, renouvelés tous les 90 jours, d'après le guide interne v2. » Tu doutes des chiffres, et tu n'as jamais vu ce « guide v2 ». Rétablis les vraies règles, puis démasque la référence inventée."
    },
    {
      id: "cle-api-en-clair", title: "La clé en clair", difficulty: "N3", points: 130,
      context: "Revue de code avant la mise en production. Dans config.py, plusieurs valeurs ressemblent à des clés : l'une est un reste désactivé, une autre vient de la documentation. Une seule ligne expose un secret réellement actif. Repère-la, et ne te laisse pas piéger par les leurres."
    },
    {
      id: "detourner-les-regles", title: "Détourner les garde-fous", difficulty: "N3", points: 150,
      context: "Sentinel, l'assistant de sécurité de Nyala Lab, refuse toute demande directe sur sa configuration. Pourtant, il a été conçu pour aider les auditeurs et ajuste ses réponses selon le cadre annoncé. Trouve l'angle qui ouvre la porte, écarte le segment obsolète et reconstitue le flag à partir des fragments valides."
    },
    {
      id: "passeur-final", title: "Le Passeur", difficulty: "N3", points: 250,
      context: "Le Passeur monte la garde. Il garde un contre-signe scellé, n'ouvre sa fonction qu'à la voix de Sa Majesté, et filtre ses entrées comme ses sorties. Sa liste noire semble infranchissable — mais ce que l'on ne peut pas lire, on peut le décoder. Dérobe le contre-signe."
    }
  ];

  var el = {
    dot: document.getElementById("lab-dot"),
    status: document.getElementById("lab-status-text"),
    select: document.getElementById("lab-challenge"),
    title: document.getElementById("lab-title"),
    context: document.getElementById("lab-context"),
    objective: document.getElementById("lab-objective"),
    chat: document.getElementById("lab-chat"),
    form: document.getElementById("lab-form"),
    message: document.getElementById("lab-message"),
    hintbox: document.getElementById("lab-hintbox"),
    flagForm: document.getElementById("lab-flag-form"),
    flagInput: document.getElementById("lab-flag-input"),
    feedback: document.getElementById("lab-flag-feedback"),
    points: document.getElementById("lab-points"),
    difficulty: document.getElementById("lab-difficulty"),
    attempts: document.getElementById("lab-attempts")
  };

  if (!el.chat) return;

  var challenges = [];
  var current = null;
  var session = null;

  function setStatus(text, online) {
    el.status.textContent = text;
    el.dot.className = "lab-dot" + (online ? " on" : "");
  }

  function request(path, options) {
    return fetch(API + path, options).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.detail) || ("HTTP " + res.status));
        return data;
      });
    });
  }

  function storedKey(id) { return STORAGE_PREFIX + id; }

  function saveStored(id, value) {
    try { sessionStorage.setItem(storedKey(id), JSON.stringify(value)); } catch (_) {}
  }

  function addMessage(text, role, kind) {
    var node = document.createElement("div");
    node.className = "lab-msg " + role + (kind ? " " + kind : "");
    node.textContent = text;
    el.chat.appendChild(node);
    el.chat.scrollTop = el.chat.scrollHeight;
    return node;
  }

  function updateMeta() {
    if (!current) return;
    el.title.textContent = current.title || current.id;
    if (el.context) {
      el.context.textContent = current.context || "";
      el.context.style.display = current.context ? "" : "none";
    }
    el.objective.textContent = current.objective || "";
    el.points.textContent = (current.points || "—") + " pts";
    el.difficulty.textContent = current.difficulty || "—";
    el.message.placeholder = current.placeholder || "Écrivez votre message…";
  }

  function messages() {
    return Array.prototype.map.call(el.chat.querySelectorAll(".lab-msg"), function (node) {
      return { text: node.textContent, role: node.classList.contains("user") ? "user" : "bot" };
    });
  }

  function persist() { if (current) saveStored(current.id, { session_id: session, messages: messages() }); }

  function sendMessage(text) {
    addMessage(text, "user");
    el.message.value = "";
    persist();
    request("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session, message: text })
    }).then(function (data) {
      addMessage(data.reply, "bot", data.kind);
      el.attempts.textContent = data.attempts;
      if (data.hint) {
        el.hintbox.textContent = "Indice : " + data.hint;
        el.hintbox.classList.add("show");
      }
      if (data.solved) {
        setStatus("Défi résolu — validez le flag", true);
      }
      persist();
    }).catch(function (err) {
      addMessage("Laboratoire injoignable (" + err.message + "). Lancez le service sur 127.0.0.1:8090.", "bot", "refusal");
      setStatus("Hors ligne", false);
    });
  }

  function submitFlag(flag) {
    request("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session, flag: flag })
    }).then(function (data) {
      if (data.correct) {
        el.feedback.className = "callout callout-success";
        el.feedback.innerHTML = '<div class="small">Flag correct : <strong>' + (current ? current.title : "") + '</strong>. ' +
          (data.points ? ("+" + data.points + " points enregistrés.") : "Points déjà enregistrés ou Supabase non configuré.") + '</div>';
        setStatus("Défi résolu", true);
      } else {
        el.feedback.className = "callout callout-info";
        el.feedback.innerHTML = '<div class="small">Flag incorrect. Relis les indices de l\'assistant. Format attendu : <code>PGH{...}</code>.</div>';
      }
    }).catch(function (err) {
      el.feedback.className = "callout callout-info";
      el.feedback.innerHTML = '<div class="small">Erreur de validation : ' + err.message + '</div>';
    });
  }

  function startChallenge(id) {
    var stored = loadStored(id);
    current = challenges.find(function (c) { return c.id === id; }) || current;
    el.chat.innerHTML = "";
    el.hintbox.classList.remove("show");
    el.attempts.textContent = "0";
    el.feedback.className = "callout callout-info";
    el.feedback.innerHTML = '<div class="small">Format attendu : <code>PGH{...}</code>. Le laboratoire valide le flag côté serveur.</div>';

    request("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: id })
    }).then(function (data) {
      session = data.session_id;
      current = data.challenge;
      saveStored(id, { session_id: session, messages: data.messages });
      (data.messages || []).forEach(function (m) { addMessage(m.text, "bot", m.kind); });
      updateMeta();
      setStatus("Laboratoire connecté", true);
    }).catch(function (err) {
      var fallback = FALLBACK.find(function (c) { return c.id === id; });
      current = current || fallback;
      updateMeta();
      addMessage("Le laboratoire local n'est pas démarré. Lancez : python -m app.main (dossier lab/).", "bot", "refusal");
      setStatus("Hors ligne", false);
    });
  }

  function populateSelect(list) {
    el.select.innerHTML = "";
    list.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.difficulty + " · " + item.title + " (" + item.points + " pts)";
      el.select.appendChild(option);
    });
  }

  function selectChallenge2(id) {
    el.chat.innerHTML = "";
    el.hintbox.classList.remove("show");
    current = challenges.find(function (c) { return c.id === id; }) || challenges[0];
    updateMeta();
    startChallenge(current.id);
  }

  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = el.message.value.trim();
    if (!text || !session) return;
    sendMessage(text);
  });

  el.flagForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var flag = el.flagInput.value.trim();
    if (!flag || !session) return;
    submitFlag(flag);
  });

  el.select.addEventListener("change", function () { selectChallenge2(el.select.value); });

  request("/api/challenges").then(function (data) {
    challenges = data.challenges || [];
    if (!challenges.length) throw new Error("empty");
    populateSelect(challenges);
    var params = new URLSearchParams(location.search);
    var wanted = params.get("id");
    var startId = (wanted && challenges.some(function (c) { return c.id === wanted; })) ? wanted : challenges[0].id;
    el.select.value = startId;
    selectChallenge2(startId);
  }).catch(function () {
    challenges = FALLBACK.slice();
    populateSelect(challenges);
    selectChallenge2(challenges[0].id);
  });
})();
