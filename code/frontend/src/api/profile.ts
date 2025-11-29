const PROFILE_URL = "http://127.0.0.1:8005";

/* 🔐 Ajoute automatiquement le token */
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

/* ==============================
   👤 Profil du client
   ============================== */

export const getMyProfile = async () => {
  const res = await fetch(`${PROFILE_URL}/profile/me`, {
    method: "GET",
    headers: authHeaders(),
  });
  return res.json();
};

export const updateMyProfile = async (payload: any) => {
  const res = await fetch(`${PROFILE_URL}/profile/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const patchMyProfile = async (payload: any) => {
  const res = await fetch(`${PROFILE_URL}/profile/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteMyProfile = async () => {
  await fetch(`${PROFILE_URL}/profile/me`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return true;
};


/* ==============================
   👨‍🏫 Coach → Profil d’un client
   ============================== */

export const getProfileOfClient = async (clientId: number) => {
  const res = await fetch(`${PROFILE_URL}/profile/${clientId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return res.json();
};


/* ==============================
   ⚖️ Historique du poids
   ============================== */

export const getMyWeights = async () => {
  const res = await fetch(`${PROFILE_URL}/profile/me/weights`, {
    method: "GET",
    headers: authHeaders(),
  });
  return res.json();
};

export const addMyWeight = async (payload: any) => {
  const res = await fetch(`${PROFILE_URL}/profile/me/weights`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteMyWeight = async (weightId: number) => {
  await fetch(`${PROFILE_URL}/profile/me/weights/${weightId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return true;
};
