import { candidateRepository } from "@/repositories/candidate.repository"
import type { CreateCandidateInput, UpdateCandidateInput, ListCandidatesQuery } from "@/types/recruitment.types"

/**
 * Service managing recruitment candidates, lifecycle, queries, and constraints.
 */
export class CandidateService {
  /**
   * Creates a new recruitment candidate record.
   *
   * @param input - Candidate profile creation data
   * @returns Newly created candidate record
   */
  async create(input: CreateCandidateInput) {
    return candidateRepository.create(input)
  }

  /**
   * Finds a candidate by primary ID.
   *
   * @param id - Candidate unique identifier
   * @returns Candidate record
   * @throws {Error} If candidate does not exist
   */
  async findById(id: string) {
    const candidate = await candidateRepository.findById(id)
    if (!candidate) {
      throw new Error("Candidate not found")
    }
    return candidate
  }

  /**
   * Finds a candidate by unique email address.
   *
   * @param email - Candidate email
   * @returns Candidate record
   * @throws {Error} If candidate does not exist
   */
  async findByEmail(email: string) {
    const candidate = await candidateRepository.findByEmail(email)
    if (!candidate) {
      throw new Error("Candidate not found")
    }
    return candidate
  }

  /**
   * Retrieves a paginated and filtered list of candidates.
   *
   * @param query - Filter parameters, search string, and pagination options
   * @returns Paginated candidates list and metadata
   */
  async list(query: ListCandidatesQuery) {
    return candidateRepository.list(query)
  }

  /**
   * Updates an existing candidate's information.
   *
   * @param id - Candidate identifier to update
   * @param input - Updated fields
   * @returns Updated candidate record
   * @throws {Error} If candidate does not exist
   */
  async update(id: string, input: UpdateCandidateInput) {
    const existing = await this.findById(id)

    return candidateRepository.update(id, { ...input, id })
  }

  /**
   * Deletes a candidate record if there are no active recruitment applications.
   *
   * @param id - Candidate identifier to delete
   * @returns Deleted candidate or repository result
   * @throws {Error} If candidate not found or has active recruitment applications
   */
  async delete(id: string) {
    const existing = await this.findById(id)

    // Prevent deletion if candidate has active applications
    if (existing.applications && existing.applications.length > 0) {
      const activeStatuses = ["new", "reviewing", "shortlisted", "interviewing", "final_review", "offer_sent", "offer_accepted"]
      const hasActive = existing.applications.some((app) => activeStatuses.includes(app.status))
      if (hasActive) {
        throw new Error("Cannot delete candidate with active applications")
      }
    }

    return candidateRepository.delete(id)
  }

  /**
   * Retrieves recruitment candidate aggregate statistics.
   *
   * @returns Candidate status counts and recruitment metrics
   */
  async getStats() {
    return candidateRepository.getStats()
  }
}

export const candidateService = new CandidateService()
