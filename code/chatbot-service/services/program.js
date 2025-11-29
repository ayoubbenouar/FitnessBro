// services/program.js
export async function createProgram(token, programJson) {
  const base = process.env.PROGRAM_SERVICE_URL;
  if (!base) throw new Error("PROGRAM_SERVICE_URL manquant");

  const res = await fetch(`${base}/program`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(programJson),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Erreur program-service: " + errText);
  }

  return res.json();
}
