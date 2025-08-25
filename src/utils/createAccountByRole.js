import Admin from "../models/admin.js";
import User from "../models/user.js";

export const createAccountByRole = async ({ userId, name, email, hashedPassword, role, profileImage = null }) => {
  console.log(userId, name, email, hashedPassword, role, "from utils");
  
  // Prepare the user data object
  const userData = {
    _id: userId,
    name,
    email,
    password: hashedPassword,
    role,
  };

  // Add profile image if provided
  if (profileImage) {
    userData.profileImage = profileImage;
  }

  if (role === 'admin') {
    const newAdmin = await new Admin(userData).save();
    return { 
      id: newAdmin._id, 
      name, 
      email, 
      role,
      profileImage: newAdmin.profileImage || null
    };
  }

  const newUser = await new User(userData).save();
  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    profileImage: newUser.profileImage || null
  };
};