import { AuthService } from "../services/AuthService";
import { Request, Response } from "express";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Email and password are required" });
      }

      const result = await AuthService.login({ email, password }, rememberMe);

      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV ? "none" : "lax",
        path: "/",
        maxAge: 5 * 60 * 1000,
      });

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV ? "none" : "lax",
        path: "/",
        maxAge: rememberMe
          ? 7 * 24 * 60 * 60 * 1000 // 7 days
          : 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result, 
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to login user",
      });
    }
  }

  static async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refresh_token;
    await AuthService.logout(refreshToken);

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV ? "none" : "lax",
      path: "/",
    });
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({ success: true, message: "Logged out" });
  }

  static async googleCallback(req: Request, res: Response) {
    try {
      const result = req.user as {
        user: any;
        accessToken: string;
        refreshToken: string;
      };
      if (!result?.accessToken) {
        return res
          .status(400)
          .json({ success: false, message: "Google authentication failed" });
      }

      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV ? "none" : "lax",
        path: "/",
        maxAge: 5 * 60 * 1000,
      });

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV ? "none" : "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });

      if (process.env.FRONTEND_URL_PROD) {
        res.redirect(process.env.FRONTEND_URL_PROD || "/");
      } else {
        res.redirect(process.env.FRONTEND_URL || "/");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Google auth failed" });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const user = JSON.parse(JSON.stringify(req.user));
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            address: user.address,
            rtId: user.rtId,
            profile: user.profile,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await AuthService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send password reset email",
      });
    }
  }

  static async validateToken(req: Request, res: Response) {
    try {
      const { token, email } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await AuthService.validateToken(token, email);
      console.log("result", result);
      res.status(200).json({
        success: true,
        message: "Token is valid",
        data: result,
      });
    } catch (error) {
      console.log("error", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to validate token",
      });
    }
  }

  static async changeForgotPassword(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      console.log(email, password);
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required",
        });
      }

      await AuthService.changeForgotPassword(email, password);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to change password",
      });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      const userId = JSON.parse(JSON.stringify(req.user)).id;
      console.log("userId", userId);

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "email, and password are required",
        });
      }

      await AuthService.changePassword(userId, password);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to change password",
      });
    }
  }

  static async sendOtp(req: Request, res: Response) {
    const { email, password, name, phone, address, rtId } = req.body;
    try {
      const response = await AuthService.sendOtp(
        email,
        password,
        name,
        phone,
        address,
        rtId
      );
      res.json({
        success: true,
        message: "OTP sent successfully",
        token: response,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send OTP",
      });
    }
  }

  static async resendOtp(req: Request, res: Response) {
    const { token } = req.body;
    try {
      await AuthService.resendOtp(token);
      res.json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send OTP",
      });
    }
  }

  static async register(req: Request, res: Response) {
    console.log("masuk validate Token");
    const { token, otp } = req.body;
    try {
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }
      const result = await AuthService.register(token, otp);
      console.log("result", result);
      res.status(200).json({
        success: true,
        message: "Token is valid",
        data: result,
      });
    } catch (error) {
      console.log("error", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to validate token",
      });
    }
  }

  static async deleteAccount(req: Request, res: Response) {
    const user = JSON.parse(JSON.stringify(req.user));

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const userId = user.id;
    console.log("userId", user.id);
    try {
      await AuthService.deleteAccount(userId);
      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete account",
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    const userId = JSON.parse(JSON.stringify(req.user)).id;
    const data = req.body;
    try {
      const result = await AuthService.updateProfile(userId, data);
      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
          id: result.id,
          name: result.name,
          phone: result.phone,
          email: result.email,
          address: result.address,
          rtId: result.rtId,
          profile: result.profile,
          role: result.role,
          isActive: result.isActive,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update user",
      });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        return res
          .status(401)
          .json({ success: false, message: "No refresh token" });
      }

      const newAccessToken = await AuthService.refreshToken(refreshToken);

      // set new cookies
      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV ? "none" : "lax",
        path: "/",
        maxAge: 60 * 1000,
      });

      return res.json({ success: true, message: "Token refreshed" });
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }
  }

  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await AuthService.getAllUsers();
      return res.status(200).json({
        success: true,
        message: "All users retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch all users",
      });
    }
  }

  static async getAllRTAdmins(req: Request, res: Response) {
    const { search } = req.query;
    const formattedSearch = String(search);
    try {
      const users = await AuthService.getAllRTAdmins(formattedSearch);
      return res.status(200).json({
        success: true,
        message: "All RT admins retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch RT admins",
      });
    }
  }

  static async getAllAvailableKecamatan(req: Request, res: Response) {
    try {
      const users = await AuthService.getAllAvailableKecamatan();
      return res.status(200).json({
        success: true,
        message: "All available kecamatan retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch available kecamatan",
      });
    }
  }

  static async getAllAvailableKelurahan(req: Request, res: Response) {
    const kecamatan = req.params.kecamatan;
    try {
      const users = await AuthService.getAllAvailableKelurahan(kecamatan);
      return res.status(200).json({
        success: true,
        message: "All available kelurahan retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch available kelurahan",
      });
    }
  }

  static async getAllAvailableRW(req: Request, res: Response) {
    const kecamatan = req.params.kecamatan;
    const kelurahan = req.params.kelurahan;
    try {
      const users = await AuthService.getAllAvailableRW(kecamatan, kelurahan);
      return res.status(200).json({
        success: true,
        message: "All available RW retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch available RW",
      });
    }
  }

  static async getAllAvailableRT(req: Request, res: Response) {
    const kecamatan = req.params.kecamatan;
    const kelurahan = req.params.kelurahan;
    const rw = req.params.rw;
    try {
      const users = await AuthService.getAllAvailableRT(
        kecamatan,
        kelurahan,
        rw
      );
      return res.status(200).json({
        success: true,
        message: "All available RT retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch available RT",
      });
    }
  }

  static async getAllAvailableRTLocation(req: Request, res: Response) {
    try {
      const users = await AuthService.getAllAvailableRTLocation();
      return res.status(200).json({
        success: true,
        message: "All available RT retrieved successfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch available RT",
      });
    }
  }

  static async getRtLocationBasedOnRtId(req: Request, res: Response) {
    const rtId = req.params.rt;
    try {
      const users = await AuthService.getRtLocationBasedOnRtId(rtId);
      return res.status(200).json({
        success: true,
        message: "Location Retrieved Succesfully",
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch location",
      });
    }
  }
}
