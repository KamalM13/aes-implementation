from bson import ObjectId
from flask_cors import CORS
from constants import s_box, inv_s_box
import logging
from flask import Flask, request, jsonify
import pymongo

mongo_uri = "mongodb+srv://drifterpaki:Gfw3zRauuMgvaUnm@cluster0.j5ixu.mongodb.net/"
mongo_client = pymongo.MongoClient(mongo_uri)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AESLogger")

app = Flask(__name__)
origins = ["http://localhost:5173", "https://aes-project.vercel.app"]
CORS(app, supports_credentials=True, resources={r"/*": {"origins": origins}})


def sub_bytes(s):
    for i in range(4):
        for j in range(4):
            s[i][j] = s_box[s[i][j]]


def inv_sub_bytes(s):
    for i in range(4):
        for j in range(4):
            s[i][j] = inv_s_box[s[i][j]]


def shift_rows(s):
    s[0][1], s[1][1], s[2][1], s[3][1] = s[1][1], s[2][1], s[3][1], s[0][1]
    s[0][2], s[1][2], s[2][2], s[3][2] = s[2][2], s[3][2], s[0][2], s[1][2]
    s[0][3], s[1][3], s[2][3], s[3][3] = s[3][3], s[0][3], s[1][3], s[2][3]


def inv_shift_rows(s):
    s[0][1], s[1][1], s[2][1], s[3][1] = s[3][1], s[0][1], s[1][1], s[2][1]
    s[0][2], s[1][2], s[2][2], s[3][2] = s[2][2], s[3][2], s[0][2], s[1][2]
    s[0][3], s[1][3], s[2][3], s[3][3] = s[1][3], s[2][3], s[3][3], s[0][3]


def add_round_key(s, k):
    for i in range(4):
        for j in range(4):
            s[i][j] ^= k[i][j]


xtime = lambda a: (((a << 1) ^ 0x1B) & 0xFF) if (a & 0x80) else (a << 1)


def mix_single_column(a):
    t = a[0] ^ a[1] ^ a[2] ^ a[3]
    u = a[0]
    a[0] ^= t ^ xtime(a[0] ^ a[1])
    a[1] ^= t ^ xtime(a[1] ^ a[2])
    a[2] ^= t ^ xtime(a[2] ^ a[3])
    a[3] ^= t ^ xtime(a[3] ^ u)


def mix_columns(s):
    for i in range(4):
        mix_single_column(s[i])


def inv_mix_columns(s):
    for i in range(4):
        u = xtime(xtime(s[i][0] ^ s[i][2]))
        v = xtime(xtime(s[i][1] ^ s[i][3]))
        s[i][0] ^= u
        s[i][1] ^= v
        s[i][2] ^= u
        s[i][3] ^= v

    mix_columns(s)


r_con = (
    0x00,
    0x01,
    0x02,
    0x04,
    0x08,
    0x10,
    0x20,
    0x40,
    0x80,
    0x1B,
    0x36,
    0x6C,
    0xD8,
    0xAB,
    0x4D,
    0x9A,
    0x2F,
    0x5E,
    0xBC,
    0x63,
    0xC6,
    0x97,
    0x35,
    0x6A,
    0xD4,
    0xB3,
    0x7D,
    0xFA,
    0xEF,
    0xC5,
    0x91,
    0x39,
)


def bytes2matrix(text):
    """Converts a 16-byte array into a 4x4 matrix."""
    return [list(text[i : i + 4]) for i in range(0, len(text), 4)]


def matrix2bytes(matrix):
    """Converts a 4x4 matrix into a 16-byte array."""
    return bytes(sum(matrix, []))


def xor_bytes(a, b):
    """Returns a new byte array with the elements xor'ed."""
    return bytes(i ^ j for i, j in zip(a, b))


def inc_bytes(a):
    """Returns a new byte array with the value increment by 1"""
    out = list(a)
    for i in reversed(range(len(out))):
        if out[i] == 0xFF:
            out[i] = 0
        else:
            out[i] += 1
            break
    return bytes(out)


def pad(plaintext):
    """
    Pads the given plaintext with PKCS#7 padding to a multiple of 16 bytes.
    """
    padding_len = 16 - (len(plaintext) % 16)
    padding = bytes([padding_len] * padding_len)
    return plaintext + padding


def unpad(plaintext):
    """
    Removes a PKCS#7 padding, returning the unpadded text and ensuring the
    padding was correct.
    """
    padding_len = plaintext[-1]
    assert padding_len > 0
    message, padding = plaintext[:-padding_len], plaintext[-padding_len:]
    assert all(p == padding_len for p in padding)
    return message


def split_blocks(message, block_size=16, require_padding=True):
    assert len(message) % block_size == 0 or not require_padding
    return [message[i : i + 16] for i in range(0, len(message), block_size)]


class AES:
    """
    Class for AES-128 encryption with CBC mode and PKCS#7 padding.
    """

    rounds_by_key_size = {16: 10, 24: 12, 32: 14}

    def __init__(self, master_key, disabled_steps=None):
        """
        Initializes the object with a given key.
        """
        assert len(master_key) in AES.rounds_by_key_size
        self.n_rounds = AES.rounds_by_key_size[len(master_key)]
        self._key_matrices = self._expand_key(master_key)
        self.logs = []
        self.disabled_steps = disabled_steps or []

    def log_state(self, step, state):
        # Format the state as a hexadecimal string for logging
        formatted_state = "\n".join(
            [" ".join(f"{byte:02x}" for byte in row) for row in state]
        )
        log_entry = {"step": step, "state": formatted_state}
        self.logs.append(log_entry)

        logger.debug(f"{step}:\n{formatted_state}\n")

    def _expand_key(self, master_key):
        """
        Expands and returns a list of key matrices for the given master_key.
        """
        # Initialize round keys with raw key material.
        key_columns = bytes2matrix(master_key)
        iteration_size = len(master_key) // 4

        i = 1
        while len(key_columns) < (self.n_rounds + 1) * 4:
            # Copy previous word.
            word = list(key_columns[-1])

            
            if len(key_columns) % iteration_size == 0:
                # Circular shift.
                word.append(word.pop(0))
                # Map to S-BOX.
                word = [s_box[b] for b in word]
                # XOR with first byte of R-CON, since the others bytes of R-CON are 0.
                word[0] ^= r_con[i]
                i += 1
            elif len(master_key) == 32 and len(key_columns) % iteration_size == 4:
                # Run word through S-box in the fourth iteration when using a
                # 256-bit key.
                word = [s_box[b] for b in word]

            # XOR with equivalent word from previous iteration.
            word = xor_bytes(word, key_columns[-iteration_size])
            key_columns.append(word)

        # Group key words in 4x4 byte matrices.
        return [key_columns[4 * i : 4 * (i + 1)] for i in range(len(key_columns) // 4)]

    def encrypt_block(self, plaintext):
        assert len(plaintext) == 16
        plain_state = bytes2matrix(plaintext)
        print(self.disabled_steps)
        self.log_state("Input to Round 0", plain_state)
        if "AddRoundKey (Round 0)" not in self.disabled_steps:
            add_round_key(plain_state, self._key_matrices[0])
        self.log_state("after mix with key (Round 0)", plain_state)

        for i in range(1, self.n_rounds):
            if f"S-Box (Round {i})" not in self.disabled_steps:
                print(self.disabled_steps)
                sub_bytes(plain_state)
            self.log_state(f"after S-Box: (Round {i})", plain_state)

            if f"Permutation (Round {i})" not in self.disabled_steps:
                shift_rows(plain_state)
            self.log_state(f"after permutation: (Round {i})", plain_state)

            if f"Mult (Round {i})" not in self.disabled_steps:
                mix_columns(plain_state)
            self.log_state(f"after mult (Round {i})", plain_state)

            if f"Subkey (Round {i})" not in self.disabled_steps:
                add_round_key(plain_state, self._key_matrices[i])
            self.log_state(f"used subkey: (Round {i})", plain_state)

        if "S-Box (Final Round)" not in self.disabled_steps:
            sub_bytes(plain_state)
        self.log_state("after S-Box: (Final Round)", plain_state)

        if "Permutation (Final Round)" not in self.disabled_steps:
            shift_rows(plain_state)
        self.log_state("after permutation: (Final Round)", plain_state)

        if "Subkey (Final Round)" not in self.disabled_steps:
            add_round_key(plain_state, self._key_matrices[-1])
        self.log_state("after mix with key: (Final Round)", plain_state)

        return matrix2bytes(plain_state)

    def decrypt_block(self, ciphertext):
        assert len(ciphertext) == 16
        cipher_state = bytes2matrix(ciphertext)

        self.log_state("Input to Round 0", cipher_state)
        add_round_key(cipher_state, self._key_matrices[-1])
        self.log_state("After AddRoundKey (Round 0)", cipher_state)

        inv_shift_rows(cipher_state)
        self.log_state("After InvShiftRows (Round 0)", cipher_state)

        inv_sub_bytes(cipher_state)
        self.log_state("After InvSubBytes (Round 0)", cipher_state)

        for i in range(self.n_rounds - 1, 0, -1):
            add_round_key(cipher_state, self._key_matrices[i])
            self.log_state(
                f"After AddRoundKey (Round {self.n_rounds - i})", cipher_state
            )

            inv_mix_columns(cipher_state)
            self.log_state(
                f"After InvMixColumns (Round {self.n_rounds - i})", cipher_state
            )

            inv_shift_rows(cipher_state)
            self.log_state(
                f"After InvShiftRows (Round {self.n_rounds - i})", cipher_state
            )

            inv_sub_bytes(cipher_state)
            self.log_state(
                f"After InvSubBytes (Round {self.n_rounds - i})", cipher_state
            )

        add_round_key(cipher_state, self._key_matrices[0])
        self.log_state("After AddRoundKey (Final Round)", cipher_state)

        return matrix2bytes(cipher_state)


def parse_input(data, key_field, text_field):
    def to_bytes(input_data):
        if isinstance(input_data, str):
            try:
                return bytes.fromhex(input_data)
            except ValueError:
                return input_data.encode()
        elif isinstance(input_data, (bytes, bytearray)):
            return input_data
        raise ValueError("Unsupported input format")

    key = to_bytes(data[key_field])
    text = to_bytes(data[text_field])
    return key, text

def is_weak_key(key: bytes) -> tuple[bool, str | None]:
    """Check if the given AES key is weak and return the reason."""
    if len(set(key)) <= len(key) // 4:  # Too many repeated bytes
        return True, "Key has too many repeated bytes."
    if all(byte == key[0] for byte in key):  # All bytes are the same
        return True, "Key has identical bytes."
    if key == b'\x00' * len(key):  # All zero key
        return True, "Key is an all-zero key."
    if key == b'\xFF' * len(key):  # All one key
        return True, "Key is an all-one key."
    return False, None


def is_semiweak_key(key: bytes) -> tuple[bool, str | None]:
    """Check if the given AES key exhibits semi-weak characteristics and return the reason."""
    # Validate key length for AES
    if len(key) not in {16, 24, 32}:
        raise ValueError("Invalid AES key length")

    # Check for mirrored keys (first half == reversed second half)
    half_length = len(key) // 2
    if len(key) % 2 == 0 and key[:half_length] == key[half_length:][::-1]:
        return True, "Key is a mirrored key (first half equals reversed second half)."

    # Check for cyclic patterns
    for i in range(1, len(key) // 2 + 1):
        if len(key) % i == 0 and key == key[:i] * (len(key) // i):
            return True, "Key exhibits a cyclic pattern."

    # Check for low Hamming distance from weak keys
    weak_keys = [
        b'\x00' * len(key),  # All-zero key
        b'\xFF' * len(key),  # All-one key
        b'\xAA' * len(key),  # Alternating 10101010
        b'\x55' * len(key),  # Alternating 01010101
    ]
    for weak_key in weak_keys:
        if hamming_distance(key, weak_key) < len(key) // 4:  # Adjustable threshold
            return True, f"Key has a low Hamming distance to weak key: {weak_key.hex()}."

    return False, None



def hamming_distance(key1: bytes, key2: bytes) -> int:
    """Calculate the Hamming distance between two byte strings."""
    return sum(bin(byte1 ^ byte2).count('1') for byte1, byte2 in zip(key1, key2))


@app.route("/encrypt", methods=["POST"])
def encrypt():
    try:
        data = request.get_json()
        key, plaintext = parse_input(data, "key", "plaintext")

        if len(plaintext) % 16 != 0:
            plaintext = pad(plaintext)
        if len(key) % 16 != 0:
            key = pad(key)
        disabled_steps = data.get("disabled_steps", [])
        print(disabled_steps)

        if len(key) not in [16, 24, 32]:
            return jsonify({"message": f"Invalid key length: {len(key)} bytes"}), 400

        if len(plaintext) % 16 != 0:
            return (
                jsonify(
                    {
                        "message": "Invalid plaintext length: must be a multiple of 16 bytes"
                    }
                ),
                400,
            )
        
        # Check if the key is weak
        is_weak, weak_reason = is_weak_key(key)
        if is_weak:
            return jsonify({"message": f"Provided key is weak: {weak_reason}"}), 400

        # Check if the key is semi-weak
        is_semiweak, semiweak_reason = is_semiweak_key(key)
        if is_semiweak:
            return jsonify({"message": f"Provided key is semi-weak: {semiweak_reason}"}), 400


        aes = AES(key, disabled_steps=disabled_steps)
        ciphertext = aes.encrypt_block(plaintext)
        
         # Get and validate userId
        userId = data.get("userId") or "default"


        try:
            userId = ObjectId(userId)
        except Exception:
            return jsonify({"message": "Invalid userId format"}), 400
        
        # Insert history entry into the user's document
        db = mongo_client["test"]
        collection = db["users"]

        history_entry = {
            "key": key.hex(),
            "plaintext": plaintext.hex(),
            "ciphertext": ciphertext.hex(),
            "steps": aes.logs,
        }

        # Update the user where the userId matches the `userId` field
        result = collection.update_one(
            {"_id": userId},
            {"$push": {"history": history_entry}}
        )

        return jsonify({"ciphertext": ciphertext.hex(), "steps": aes.logs})

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route("/decrypt", methods=["POST"])
def decrypt():
    try:
        data = request.get_json()
        key, ciphertext = parse_input(data, "key", "ciphertext")

        if len(key) % 16 != 0:
            key = pad(key)

        aes = AES(key)
        plaintext = aes.decrypt_block(ciphertext)

        return jsonify(
            {"plaintext": plaintext.decode(errors="replace"), "steps": aes.logs}
        )
    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route("/history/<user_id>", methods=["GET"])
def get_user_history(user_id):
    try:
        # Convert user_id to ObjectId
        try:
            user_id = ObjectId(user_id)
        except Exception:
            return jsonify({"message": "Invalid userId format"}), 400

        # Fetch the user document from MongoDB
        db = mongo_client["test"]
        collection = db["users"]

        user = collection.find_one({"_id": user_id})

        if not user:
            return jsonify({"message": f"User with _id '{user_id}' not found"}), 404

        # Retrieve the history, if available
        history = user.get("history", [])
        return jsonify({"history": history})

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)
