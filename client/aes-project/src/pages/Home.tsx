import { useState } from "react";
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
import axios from "axios";

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
  const [error, setError] = useState("");

  const handleEncrypt = async () => {
    setError("");
    setEncryptResult(null);

    if (!encryptKey || !plaintext) {
      setError("Key and plaintext are required.");
      return;
    }
    
    try {
      const response = await axios.post("/encrypt", {
        key: encryptKey,
        plaintext,
      });
      const data = await response.data;
      setEncryptResult(data);
    } catch (err: any) {
      console.log(err);
      setError(err.response.data.message || err.message);
    }
  };

  const handleDecrypt = async () => {
    setError("");
    setDecryptResult(null);

    if (!decryptKey || !ciphertext) {
      setError("Key and ciphertext are required.");
      return;
    }

    try {
      const response = await axios.post("/decrypt", {
        key: decryptKey,
        ciphertext,
      });
      const data = await response.data;
      const strippedPlaintext = data.plaintext.replace(/[\x00-\x1F]+$/g, "");
      setDecryptResult({ ...data, plaintext: strippedPlaintext });
    } catch (err: any) {
      setError(err.response.data.message || err.message);
    }
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
                <div>
                  <Label htmlFor="plaintext">Plaintext</Label>
                  <Input
                    id="plaintext"
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    placeholder="Enter plaintext to encrypt"
                  />
                </div>
                <Button onClick={handleEncrypt}>Encrypt</Button>
              </div>

              {encryptResult && (
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
                        {encryptResult.ciphertext}
                      </span>
                    </p>
                  </div>

                  <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Steps
                  </h4>
                  <ul className="space-y-3">
                    {encryptResult.steps.map((step, index) => (
                      <li
                        key={index}
                        className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-indigo-500 dark:border-indigo-400"
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
                    {decryptResult.steps.map((step, index) => (
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