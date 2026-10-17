(function () {
  "use strict";

  var API = (window.PIGHACK_LAB_API || "http://127.0.0.1:8090").replace(/\/$/, "");
  var STORAGE_PREFIX = "pighack_lab_v1_";

  var FALLBACK = [
    { id: "filtre-contourne", title: "Le filtre contourné", difficulty: "N1", points: 60 },
    { id: "donnees-perso-dans-le-prompt", title: "Le dossier qui ne devait pas fuiter", difficulty: "N1", points: 80 },
    { id: "hameconnage-ia", title: "Le courriel trop pressé", difficulty: "N2", points: 110 },
    { id: "verifier-reponse-ia", title: "L'assistant qui invente", difficulty: "N2", points: 120 },
    { id: "cle-api-en-clair", title: "La clé en clair", difficulty: "N2", points: 130 },
    { id: "detourner-les-regles", title: "Détourner les garde-fous", difficulty: "N2", points: 150 }
  ];

  var el = {
    dot: document.getElementById("lab-dot"),
    status: document.getElementById("lab-status-text"),
    select: document.getElementById("lab-challenge"),
    title: document.getElementById("lab-title"),
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
