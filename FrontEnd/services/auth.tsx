import api from "./api";

/**
 * AuthService
 * Handles all authentication-related API requests.
 */
export const authService = {
  /**
   * Logs in a user using their phone (as username) and password.
   * 
   * @param formData - Must contain 'username' (phone) and 'password'.
   * FastAPI OAuth2 expects "application/x-www-form-urlencoded".
   */
  async login(formData: FormData) {
    const response = await api.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },

  /**
   * Registers a new user (Farmer or Buyer).
   * 
   * @param userData - Object containing full_name, phone, password, and role.
   */
  async register(userData: any) {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  /**
   * Retrieves the core user account information for the currently 
   * logged-in session.
   */
  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * Optional: Request a password reset OTP (to be implemented in backend).
   */
  async forgotPassword(phone: string) {
    const response = await api.post("/auth/forgot-password", { phone });
    return response.data;
  }
};