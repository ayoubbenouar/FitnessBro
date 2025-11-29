// services/profile.js
export async function getProfile(clientId) {
  // 👉 Endpoint interne ajouté dans le profile-service (sans auth)
  const url = `${process.env.PROFILE_SERVICE_URL}/internal/profile/${clientId}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible de récupérer le profil");

    return await res.json();
  } catch (e) {
    console.error("profile error:", e);
    throw new Error("Impossible de récupérer le profil");
  }
}
