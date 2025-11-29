export async function verifyToken(token) {
  try {
    const res = await fetch(process.env.AUTH_SERVICE_URL + "/auth/verify", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
