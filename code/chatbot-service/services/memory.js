let memory = {};

export function saveSuggestion(coachId, clientId, program) {
  memory[coachId] = { clientId, program };
}

export function getSuggestion(coachId) {
  return memory[coachId];
}

export function clearSuggestion(coachId) {
  delete memory[coachId];
}
