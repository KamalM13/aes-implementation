from constants import s_box, inv_s_box
import logging
from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AESLogger")

app = Flask(__name__)


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
    0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40,
    0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D, 0x9A,
    0x2F, 0x5E, 0xBC, 0x63, 0xC6, 0x97, 0x35, 0x6A,
    0xD4, 0xB3, 0x7D, 0xFA, 0xEF, 0xC5, 0x91, 0x39,
)


def bytes2matrix(text):
    """ Converts a 16-byte array into a 4x4 matrix.  """
    return [list(text[i:i+4]) for i in range(0, len(text), 4)]

def matrix2bytes(matrix):
    """ Converts a 4x4 matrix into a 16-byte array.  """
    return bytes(sum(matrix, []))

def xor_bytes(a, b):
    """ Returns a new byte array with the elements xor'ed. """
    return bytes(i^j for i, j in zip(a, b))

def inc_bytes(a):
    """ Returns a new byte array with the value increment by 1 """
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
    Note that if the plaintext size is a multiple of 16,
    a whole block will be added.
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
        return [message[i:i+16] for i in range(0, len(message), block_size)]


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
        self.disabled_steps =disabled_steps or []

        
    def log_state(self, step, state):
        # Format the state as a hexadecimal string for logging
        formatted_state = '\n'.join([' '.join(f'{byte:02x}' for byte in row) for row in state])
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

            # Perform schedule_core once every "row".
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
        return [key_columns[4*i : 4*(i+1)] for i in range(len(key_columns) // 4)]

    def encrypt_block(self, plaintext):
        print(plaintext)
        assert len(plaintext) == 16
        plain_state = bytes2matrix(plaintext)

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
            self.log_state(f"After AddRoundKey (Round {self.n_rounds - i})", cipher_state)

            inv_mix_columns(cipher_state)
            self.log_state(f"After InvMixColumns (Round {self.n_rounds - i})", cipher_state)

            inv_shift_rows(cipher_state)
            self.log_state(f"After InvShiftRows (Round {self.n_rounds - i})", cipher_state)

            inv_sub_bytes(cipher_state)
            self.log_state(f"After InvSubBytes (Round {self.n_rounds - i})", cipher_state)

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


@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.get_json()
    key, plaintext = parse_input(data, 'key', 'plaintext')
    if(len(plaintext) % 16 != 0):
        plaintext = pad(plaintext)
    if(len(key) % 16 != 0):
        key = pad(key)
    disabled_steps = data.get('disabled_steps', [])
    print(disabled_steps)
    aes = AES(key,disabled_steps=disabled_steps)
    ciphertext = aes.encrypt_block(plaintext)

    return jsonify({
        "ciphertext": ciphertext.hex(),
        "steps": aes.logs
    })

@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.get_json()
    key, ciphertext = parse_input(data, 'key', 'ciphertext')

    aes = AES(key)
    plaintext = aes.decrypt_block(ciphertext)

    return jsonify({
        "plaintext": plaintext.decode(errors='replace'),
        "steps": aes.logs
    })

if __name__ == '__main__':
    app.run(debug=True)
    