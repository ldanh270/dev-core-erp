import bcrypt from "bcryptjs"

/**
 * Utility for cryptographically secure password hashing and verification using bcrypt.
 */
export class HashUtil {
  /**
   * Hashes a plain-text password using bcrypt with a salt cost factor of 10.
   *
   * @param password - Plain-text password to hash
   * @returns Promise resolving to the generated bcrypt hash string
   */
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  /**
   * Compares a plain-text candidate password with an existing bcrypt hash.
   *
   * @param password - Plain-text password entered by user
   * @param hash - Stored bcrypt hash string to compare against
   * @returns Promise resolving to true if passwords match, false otherwise
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
