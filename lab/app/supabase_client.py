"""Crédit des points Supabase depuis le laboratoire.

Le lab valide le flag localement, puis peut enregistrer la réussite et créditer
les points via une fonction RPC Supabase :

  • `lab_submit_flag(p_user_id, p_challenge_id, p_flag)` — appelée avec la clé
    **service_role** quand on connaît l'identifiant de l'étudiant ;
  • `submit_flag(p_challenge_id, p_flag)` — appelée en relayant le jeton
    d'accès de l'étudiant (Authorization: Bearer <access_token>).

Si Supabase n'est pas configuré, le lab fonctionne en mode 100 % local et se
contente de valider le flag.
"""
from __future__ import annotations

import logging

import httpx

logger = logging.getLogger("pighack.lab.supabase")


class SupabaseAwarder:
    def __init__(self, url: str, service_role_key: str, anon_key: str = ""):
        self.url = (url or "").rstrip("/")
        self.service_role_key = service_role_key or ""
        self.anon_key = anon_key or ""

    @property
    def enabled(self) -> bool:
        return bool(self.url and self.service_role_key)

    def _service_headers(self) -> dict:
        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
        }

    async def award(
        self,
        challenge_id: str,
        flag: str,
        user_id: str | None = None,
        access_token: str | None = None,
    ) -> dict:
        if not self.enabled:
            return {"success": False, "error": "NOT_CONFIGURED"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if access_token and self.anon_key:
                    return await self._submit_as_user(client, challenge_id, flag, access_token)
                if user_id:
                    return await self._submit_as_service(client, challenge_id, flag, user_id)
        except httpx.HTTPError as exc:  # pragma: no cover - dépend du réseau
            logger.warning("Supabase injoignable : %s", exc)
            return {"success": False, "error": "NETWORK", "message": str(exc)}

        return {"success": False, "error": "NO_IDENTITY"}

    async def _submit_as_service(self, client, challenge_id, flag, user_id) -> dict:
        payload = {
            "p_user_id": user_id,
            "p_challenge_id": challenge_id,
            "p_flag": flag,
        }
        resp = await client.post(
            f"{self.url}/rest/v1/rpc/lab_submit_flag",
            json=payload,
            headers=self._service_headers(),
        )
        return self._parse(resp)

    async def _submit_as_user(self, client, challenge_id, flag, access_token) -> dict:
        payload = {"p_challenge_id": challenge_id, "p_flag": flag}
        headers = {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        resp = await client.post(
            f"{self.url}/rest/v1/rpc/submit_flag", json=payload, headers=headers
        )
        return self._parse(resp)

    @staticmethod
    def _parse(resp: httpx.Response) -> dict:
        if resp.status_code >= 400:
            return {
                "success": False,
                "error": f"HTTP_{resp.status_code}",
                "message": resp.text[:300],
            }
        try:
            data = resp.json()
        except ValueError:
            return {"success": False, "error": "BAD_JSON", "message": resp.text[:300]}
        if isinstance(data, dict):
            return data
        return {"success": True, "result": data}
