/**
 * ==============================================================================
 * PIGHACK — Client Frontend Supabase
 * Fournit l'intégration complète avec Supabase Auth, la base de données et les RPC.
 * ==============================================================================
 */

(function (window) {
  "use strict";

  // Configuration par défaut (à remplacer par vos identifiants Supabase)
  var CONFIG = window.PIGHACK_CONFIG || {
    url: window.SUPABASE_URL || "https://VOTRE_PROJET.supabase.co",
    anonKey: window.SUPABASE_ANON_KEY || "VOTRE_CLE_ANON_PUBLIQUE"
  };

  var supabase = null;

  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      supabase = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
    }
    return supabase;
  }

  // --- MODULE AUTHENTIFICATION ---
  var Auth = {
    // Inscription avec pseudonyme et email
    signUp: async function (email, password, pseudo) {
      var client = initClient();
      if (!client) return { error: { message: "Client Supabase non initialisé." } };

      var res = await client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { pseudo: pseudo, username: pseudo }
        }
      });

      if (!res.error && res.data.user) {
        sessionStorage.setItem("pighack_session", JSON.stringify({
          name: pseudo,
          id: res.data.user.id
        }));
      }
      return res;
    },

    // Connexion
    signIn: async function (email, password) {
      var client = initClient();
      if (!client) return { error: { message: "Client Supabase non initialisé." } };

      var res = await client.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (!res.error && res.data.user) {
        // Récupérer le pseudo depuis le profil
        var profile = await Auth.getProfile(res.data.user.id);
        var pseudo = (profile && profile.username) || res.data.user.user_metadata.pseudo || email.split("@")[0];
        sessionStorage.setItem("pighack_session", JSON.stringify({
          name: pseudo,
          id: res.data.user.id
        }));
      }
      return res;
    },

    // Déconnexion
    signOut: async function () {
      var client = initClient();
      sessionStorage.removeItem("pighack_session");
      if (client) {
        return await client.auth.signOut();
      }
      return { success: true };
    },

    // Obtenir la session actuelle
    getUser: async function () {
      var client = initClient();
      if (!client) return null;
      var res = await client.auth.getUser();
      return res.data ? res.data.user : null;
    },

    // Profil utilisateur
    getProfile: async function (userId) {
      var client = initClient();
      if (!client) return null;
      var res = await client.from("profiles").select("*").eq("id", userId).single();
      return res.data;
    }
  };

  // --- MODULE API CTF (DÉFIS, SOUMISSIONS, LEADERBOARD) ---
  var API = {
    // Récupérer tous les défis publiés avec les étapes
    getChallenges: async function () {
      var client = initClient();
      if (!client) return { data: [], error: "Supabase non connecté" };

      return await client
        .from("challenges")
        .select("id, stage_code, stage_order, challenge_order, title, category, difficulty, points, estimated_minutes, objective, prerequisite_ids, tags")
        .order("stage_order", { ascending: true })
        .order("challenge_order", { ascending: true });
    },

    // Récupérer le détail d'un défi avec l'état de l'utilisateur et les indices
    getChallengeDetails: async function (challengeId) {
      var client = initClient();
      if (!client) return { data: null, error: "Supabase non connecté" };

      var res = await client.rpc("get_challenge_with_state", {
        p_challenge_id: challengeId
      });
      return res;
    },

    // Soumettre un flag (exécute la fonction RPC sécurisée)
    submitFlag: async function (challengeId, flag) {
      var client = initClient();
      if (!client) return { error: { message: "Supabase non connecté" } };

      return await client.rpc("submit_flag", {
        p_challenge_id: challengeId,
        p_flag: flag
      });
    },

    // Débloquer un indice (déduit les points prévus)
    unlockHint: async function (hintId) {
      var client = initClient();
      if (!client) return { error: { message: "Supabase non connecté" } };

      return await client.rpc("unlock_hint", {
        p_hint_id: hintId
      });
    },

    // Récupérer le classement des étudiants
    getLeaderboard: async function (limit) {
      var client = initClient();
      if (!client) return { data: [], error: "Supabase non connecté" };

      return await client.rpc("get_leaderboard", {
        p_limit: limit || 50
      });
    },

    // S'abonner aux mises à jour du classement en direct (Realtime)
    subscribeLeaderboard: function (callback) {
      var client = initClient();
      if (!client) return null;

      return client
        .channel("public:profiles")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, function (payload) {
          if (typeof callback === "function") callback(payload);
        })
        .subscribe();
    }
  };

  // Export global
  window.PighackSupabase = {
    init: initClient,
    auth: Auth,
    api: API,
    getClient: function () { return supabase; }
  };

})(window);

