import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Step {
  step: string;
 state: string; 
}

interface HistoryEntry {
  key: string;
  plaintext: string;
  ciphertext: string;
  steps: Step[];
}

const History = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>("");

  const auth = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_PYTHON_API_URL}/history/${auth?.user?._id}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setHistory(data.history);
        console.log(data.history);
      } catch (err) {
        setError((err as Error).message || "Error fetching history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [auth?.user?._id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-500 dark:text-gray-300">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-red-500 dark:text-red-400">
        {error}
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-xl">
      <h2 className="text-4xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-8">
        {auth.user?.firstName || "User"}'s History
      </h2>

      {history.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">No history available.</p>
      ) : (
        <div className="space-y-6">
          {history
            .slice()
            .reverse()
            .map((entry, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-xl"
              >
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Entry {history.length - index}</p>
                <p className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
                  <span className="text-blue-600">Key:</span>{" "}
                  <span className="text-gray-700 dark:text-gray-300">{entry.key}</span>
                </p>
                <p className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
                  <span className="text-green-600">Plaintext:</span>{" "}
                  <span className="text-gray-700 dark:text-gray-300 break-words">{entry.plaintext}</span>
                </p>
                <p className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-4">
                  <span className="text-red-600">Ciphertext:</span>{" "}
                  <span className="text-gray-700 dark:text-gray-300 break-words">{entry.ciphertext}</span>
                </p>
                <details className="group cursor-pointer">
                  <summary className="font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 mb-2 flex items-center">
                    <span className="mr-2">🔎 View Steps</span>
                    <span className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                      ▾
                    </span>
                  </summary>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    {entry.steps.map((stepObj, i) => (
                      <li key={i} className="text-gray-700 dark:text-gray-300">
                        <p className="font-bold">{stepObj.step}</p>
                        {stepObj.state}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default History;
