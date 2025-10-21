
import { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

function QuestionCard({ question, onApprove, onReject }) {
  const handlers = useSwipeable({
    onSwipedLeft: onReject,
    onSwipedRight: onApprove,
    delta: 50,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <div
      {...handlers}
      className="border border-gray-200 rounded p-2 text-sm text-gray-800 bg-gray-50 transition-transform duration-300 flex justify-between items-center hover:translate-x-2"
    >
      <span>{question.text}</span>
      <div className="flex gap-2">
        <button onClick={onApprove} className="text-green-600 hover:text-green-800">✔️</button>
        <button onClick={onReject} className="text-red-500 hover:text-red-700">❌</button>
      </div>
    </div>
  );
}

export default function ClientProductionsDashboard() {
  const streams = [
    { id: 1, title: "Product Launch - May 2025" },
    { id: 2, title: "Annual General Meeting - April 2025" },
    { id: 3, title: "Webinar Series - March 2025" }
  ];

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, []);

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      await addDoc(collection(db, "questions"), {
        text: newQuestion.trim(),
        status: "pending",
        timestamp: new Date()
      });
      setNewQuestion("");
    }
  };

  const updateQuestionStatus = async (id, status) => {
    const ref = doc(db, "questions", id);
    await updateDoc(ref, { status });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">❓ Live Questions</h2>
        <form onSubmit={handleQuestionSubmit} className="space-y-3 mb-4">
          <textarea
            placeholder="Enter a question to display on stream..."
            className="w-full border border-gray-300 rounded p-2 h-24"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          ></textarea>
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded shadow w-full">
            Submit Question
          </button>
        </form>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">🕵️ Moderator Panel (Pending Questions):</p>
            {questions.filter(q => q.status === "pending").map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onApprove={() => updateQuestionStatus(q.id, "approved")}
                onReject={() => updateQuestionStatus(q.id, "rejected")}
              />
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">🎤 Speaker View (Approved Questions):</p>
            {questions.filter(q => q.status === "approved").length === 0 && (
              <div className="text-sm text-gray-500 italic">No approved questions yet.</div>
            )}
            {questions.filter(q => q.status === "approved").map((q) => (
              <div key={q.id} className="border border-green-200 rounded p-2 text-sm text-gray-800 bg-green-50">
                {q.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
