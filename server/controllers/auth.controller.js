import genToken from "../config/token.js";
import User from "../models/usermodel.js";

// ✅ GOOGLE AUTH
export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;

    let user = await User.findOne({ email });

    // Create user if not exists
    if (!user) {
      user = await User.create({
        name,
        email
      });
    }

    // Generate token
    const token = await genToken(user._id);

    // ✅ Set cookie (FIXED)
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,        // ✅ for localhost
      sameSite: "lax",      // ✅ for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(user);

  } catch (error) {
    return res.status(500).json({
      message: `Google auth error ${error}`
    });
  }
};

// ✅ LOGOUT
export const logout = async (req, res) => {
  try {

    // ✅ Properly clear cookie (FIXED)
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    return res.status(200).json({
      message: "Logout Successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: `Logout error ${error}`
    });
  }
};