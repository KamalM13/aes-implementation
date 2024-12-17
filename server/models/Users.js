import { Schema, model,mongoose } from "mongoose";

const UserSchema = new Schema({
  firstName: { type:String, required:true,default:""},
  lastName: { type:String, default:""},
  password: { type: String, },
  googleId: { type: String, unique: true }, // Store Google ID for users logging in via Google

  email: { type: String, required: true, unique: true },
  phone: { type: String, },
  isAdmin: { type: Boolean, default: false },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin", "moderator"],
  },



  history: [
    {
      key: {
        type: String,
        required: true,
      },
      plaintext: {
        type: String,
        required: true,
      },
      ciphertext: {
        type: String,
        required: true,
      },
      steps: {
        type: Array,
        default: [],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  profileImage: { type: String, default: "/assets/Profile/Profile.webp" },
  role: { type: String, default: "user" },
  isActivated: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

const User = model("users", UserSchema);
export default User;