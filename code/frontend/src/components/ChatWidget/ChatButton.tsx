interface Props {
  onClick: () => void;
}

export default function ChatButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white 
                 w-14 h-14 rounded-full shadow-xl flex items-center justify-center 
                 text-3xl transition"
    >
      💬
    </button>
  );
}
