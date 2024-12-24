import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import AESDescription from "../components/Home/AESDescription";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { supabase } from "../utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface Step {
  state: string;
  step: string;
}

interface EncryptionResponse {
  ciphertext: string;
  steps: Step[];
}

interface DecryptionResponse {
  plaintext: string;
  steps: Step[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("description");
  const [encryptKey, setEncryptKey] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [encryptResult, setEncryptResult] = useState<EncryptionResponse | null>(
    null
  );
  const [decryptResult, setDecryptResult] = useState<DecryptionResponse | null>(
    null
  );
  const [disabledSteps, setDisabledSteps] = useState<String[]>([]);
  const [image, setImage] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };
  const [imageURL, setImageURL] = useState<String>();
  const [decryptUrl, setDecryptUrl] = useState("");
  const [error, setError] = useState("");
  const auth = useAuth();
  const rounds = 10;

  const toggleStep = (step: string) => {
    setDisabledSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  };
  const generateSteps = () => {
    const steps = [];

    steps.push("AddRoundKey (Round 0)");

    for (let i = 1; i <= rounds; i++) {
      steps.push(`S-Box (Round ${i})`);
      steps.push(`Permutation (Round ${i})`);
      steps.push(`Mult (Round ${i})`);
      steps.push(`Subkey (Round ${i})`);
    }

    steps.push("S-Box (Final Round)");
    steps.push("Permutation (Final Round)");
    steps.push("Subkey (Final Round)");

    return steps;
  };

  const queryClient = useQueryClient();

  const steps = generateSteps();

  const handleEncrypt = async () => {
    setError("");
    setEncryptResult(null);

    if (!encryptKey || (!plaintext && !image)) {
      setError("Key and plaintext are required.");
      return;
    }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PYTHON_API_URL}/encrypt`,
        {
          key: encryptKey,
          plaintext,
          image_url: imageURL,
          disabled_steps: disabledSteps,
          userId: auth.user?._id,
        }
      );
      const data = await response.data;
      if (data.status === 200) setEncryptResult(data);
      if (data.status === 400) {
        setError(data.message);
      }
      return data;
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["encrypt"] });
      setError(err.response.data.message || err.message);
    }
  };

  const { data: encryptionResults, refetch } = useQuery({
    queryKey: ["encrypt"],
    queryFn: handleEncrypt,
    enabled: false,
  });
  useEffect(() => {
    console.log(disabledSteps);
    refetch();
  }, [disabledSteps]);

  const handleDecrypt = async () => {
    setError("");
    setDecryptResult(null);

    if (!decryptKey || (!ciphertext && !decryptUrl)) {
      setError("Key and ciphertext are required.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PYTHON_API_URL}/decrypt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: decryptKey,
            ciphertext,
            image_url: decryptUrl,
          }),
        }
      );
      const data = await response.json();
      setDecryptResult(data);
      if (data.status === 400) {
        console.log(data.message);
        setError(data.message);
      }
    } catch (err: any) {
      console.log(err);
      setError(err.response.data.message || err.message);
    }
  };

  const handleImageUpload = async (file: any) => {
    //random identifier for image name
    const randomId = uuidv4();
    const { error } = await supabase.storage
      .from("security")
      .upload(`${file.name + randomId}`, file);

    if (error) {
      setError(error.message);
      return null;
    }

    const { publicUrl } = supabase.storage
      .from("security")
      .getPublicUrl(`${file.name + randomId}`).data;

    toast.success("Image uploaded successfully");
    console.log(publicUrl);
    setImageURL(publicUrl);
  };

  return (
    <div className="container mx-auto p-4 ">
      <h1 className="text-3xl font-bold mb-4">
        AES Encryption/Decryption Project
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
          <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <AESDescription />
        </TabsContent>

        <TabsContent value="encrypt">
          <Card>
            <CardHeader>
              <CardTitle>Encrypt Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="encryptKey">
                    Key (32 bytes, hex-encoded)
                  </Label>
                  <Input
                    id="encryptKey"
                    value={encryptKey}
                    onChange={(e) => setEncryptKey(e.target.value)}
                    placeholder="Enter 32-byte hex key"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="plaintext">Plaintext</Label>
                  <Input
                    id="plaintext"
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    placeholder="Enter plaintext to encrypt"
                  />
                  <Input
                    id="image"
                    onChange={handleFileChange}
                    placeholder="Enter image URL"
                    type="file"
                  />
                  <Button
                    onClick={() => {
                      handleImageUpload(image);
                    }}
                    disabled={!image}
                  >
                    Upload Image
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    refetch();
                  }}
                >
                  Encrypt
                </Button>
              </div>

              {encryptionResults && (
                <div className="mt-6 p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    🔒 <span>Encryption Result</span>
                  </h3>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-4">
                    <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Ciphertext:
                      </span>
                      <span className="ml-2 break-words block text-indigo-600 dark:text-indigo-400 font-mono">
                        {encryptionResults.ciphertext}
                      </span>
                    </p>
                  </div>

                  <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Steps
                  </h4>
                  <ul className="space-y-3">
                    {encryptionResults.steps &&
                      encryptionResults.steps.length > 0 &&
                      encryptionResults.steps.map(
                        (step: any, index: number) => (
                          <li
                            key={index}
                            className="p-4 px-20 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-indigo-500 dark:border-indigo-400 flex justify-between items-center"
                          >
                            <div>
                              <span className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                {step.step}
                              </span>
                              <span className="text-gray-600 dark:text-gray-300 font-mono">
                                {step.state}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleStep(steps[index - 1])}
                              className={`px-3 py-1 rounded ${
                                disabledSteps.includes(steps[index - 1])
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                            >
                              {disabledSteps.includes(steps[index - 1])
                                ? "Enable"
                                : "Disable"}
                            </button>
                          </li>
                        )
                      )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decrypt">
          <Card>
            <CardHeader>
              <CardTitle>Decrypt Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="decryptKey">
                    Key (32 bytes, hex-encoded)
                  </Label>
                  <Input
                    id="decryptKey"
                    value={decryptKey}
                    onChange={(e) => setDecryptKey(e.target.value)}
                    placeholder="Enter 32-byte hex key"
                  />
                </div>
                <div>
                  <Label htmlFor="ciphertext">Ciphertext</Label>
                  <Input
                    id="ciphertext"
                    value={ciphertext}
                    onChange={(e) => setCiphertext(e.target.value)}
                    placeholder="Enter ciphertext to decrypt"
                  />
                  <Label htmlFor="decryptUrl">Image URL</Label>
                  <Input
                    id="decryptUrl"
                    value={decryptUrl}
                    onChange={(e) => setDecryptUrl(e.target.value)}
                    placeholder="Enter image URL"
                  />
                </div>
                <Button onClick={handleDecrypt}>Decrypt</Button>
              </div>

              {decryptResult && (
                <div className="mt-6 p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    🔓 <span>Decryption Result</span>
                  </h3>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-4">
                    <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Plaintext:
                      </span>
                      <span className="ml-2 break-words block text-green-600 dark:text-green-400 font-mono">
                        {decryptResult.plaintext}
                      </span>
                    </p>
                  </div>

                  <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Steps
                  </h4>
                  <ul className="space-y-3">
                    {decryptResult.steps?.map((step, index) => (
                      <li
                        key={index}
                        className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-green-500 dark:border-green-400"
                      >
                        <span className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {step.step}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 font-mono">
                          {step.state}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
