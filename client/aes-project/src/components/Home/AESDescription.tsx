import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export default function AESDescription() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>About AES Encryption</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    AES (Advanced Encryption Standard) is a symmetric block cipher standardized by the National Institute of Standards and Technology (NIST) in 2001. It was chosen by the U.S. government to protect classified information and has become a global standard for data encryption.
                </p>
                <h3 className="text-xl font-semibold mb-2">Key Features:</h3>
                <ul className="list-disc list-inside mb-4">
                    <li><strong>Symmetric encryption:</strong> Uses the same key for both encryption and decryption.</li>
                    <li><strong>Block cipher:</strong> Encrypts data in fixed-size blocks (128 bits by default).</li>
                    <li><strong>Key sizes:</strong> Supports 128, 192, or 256-bit keys for varying levels of security.</li>
                    <li><strong>Performance:</strong> Designed for efficient implementation in both hardware and software.</li>
                </ul>
                <h3 className="text-xl font-semibold mb-2">How AES Works:</h3>
                <p className="mb-4">
                    AES encrypts data by dividing it into blocks and applying multiple rounds of substitution, permutation, and mixing operations. The number of rounds depends on the key size:
                </p>
                <ul className="list-disc list-inside mb-4">
                    <li>10 rounds for 128-bit keys</li>
                    <li>12 rounds for 192-bit keys</li>
                    <li>14 rounds for 256-bit keys</li>
                </ul>
                <h3 className="text-xl font-semibold mb-2">Example:</h3>
                <p><strong>Key:</strong> 000102030405060708090a0b0c0d0e0f</p>
                <p><strong>Plaintext:</strong> Hello, AES!</p>
                <p>
                    <strong>Ciphertext:</strong> The encrypted output depends on the encryption mode (e.g., CBC, GCM) and the Initialization Vector (IV). Example:
                    <code className="block mt-2 p-2 bg-gray-100 dark:bg-neutral-800 rounded">1a2b3c4d5e6f7g8h:a1b2c3d4e5f6g7h8i9j0</code>
                </p>
                <h3 className="text-xl font-semibold mb-2">Common Use Cases:</h3>
                <ul className="list-disc list-inside">
                    <li>Secure file storage</li>
                    <li>Protecting network communications (e.g., HTTPS, VPNs)</li>
                    <li>Encrypting sensitive data in databases</li>
                    <li>Securing IoT devices and systems</li>
                </ul>
                <p className="mt-4">
                    AES remains one of the most trusted and widely used encryption algorithms today, ensuring data confidentiality and security in countless applications worldwide.
                </p>
            </CardContent>
        </Card>
    );
}