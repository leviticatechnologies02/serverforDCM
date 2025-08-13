import Admin from "../models/admin.js";
import User from "../models/user.js";

export const createAccountByRole = async ({ userId, name, email, hashedPassword, role }) => {
  console.log(userId, name, email, hashedPassword, role, "from utlis");
  if (role === 'admin') {
    const newAdmin = await new Admin({
      _id: userId,
      name,
      email,
      password: hashedPassword,
      role,
    }).save();
    return { id: newAdmin._id, name, email, role };
  }

  const newUser = await new User({
    _id: userId,
    name,
    email,
    password: hashedPassword,
    role,
  }).save();

  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
};
