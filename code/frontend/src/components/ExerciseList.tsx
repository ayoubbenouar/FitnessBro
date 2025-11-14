import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

interface Props {
  exercises: Exercise[];
  onChange: (exercises: Exercise[]) => void;
}

export default function ExerciseList({ exercises, onChange }: Props) {
  const [newExercise, setNewExercise] = useState<Exercise>({
    name: "",
    sets: 4,
    reps: 12,
  });

  function addExercise() {
    if (!newExercise.name.trim()) return;
    onChange([...exercises, newExercise]);
    setNewExercise({ name: "", sets: 4, reps: 12 });
  }

  function removeExercise(index: number) {
    onChange(exercises.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
      <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
        🏋️ Exercices
      </h4>

      {exercises.length === 0 ? (
        <p className="text-gray-500 text-sm mb-3">
          Aucun exercice ajouté.
        </p>
      ) : (
        <ul className="space-y-1 mb-3">
          {exercises.map((ex, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-100"
            >
              <span className="text-gray-700">
                {ex.name} —{" "}
                <b className="text-gray-900">
                  {ex.sets}x{ex.reps}
                </b>
              </span>
              <button
                onClick={() => removeExercise(i)}
                className="text-red-500 hover:text-red-700 transition"
                aria-label="Supprimer l'exercice"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulaire d’ajout aligné dans le cadre */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Nom de l'exercice"
          value={newExercise.name}
          onChange={(e) =>
            setNewExercise({ ...newExercise, name: e.target.value })
          }
          className="flex-1 min-w-[150px] border rounded px-2 py-1 text-sm"
        />
        <input
          type="number"
          min={1}
          value={newExercise.sets}
          onChange={(e) =>
            setNewExercise({ ...newExercise, sets: Number(e.target.value) })
          }
          className="w-16 border rounded px-2 py-1 text-sm text-center"
        />
        <input
          type="number"
          min={1}
          value={newExercise.reps}
          onChange={(e) =>
            setNewExercise({ ...newExercise, reps: Number(e.target.value) })
          }
          className="w-16 border rounded px-2 py-1 text-sm text-center"
        />
        <button
          onClick={addExercise}
          type="button"
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition"
        >
          <PlusCircle size={16} /> Ajouter
        </button>
      </div>
    </div>
  );
}
