type UserWithEmail = {
  email?: string | null
}

export const normalizeEmailAddress = (email: string) => email.trim().toLowerCase()

export const findUserByEmail = <T extends UserWithEmail>(
  users: T[],
  email: string
) => {
  const normalizedEmail = normalizeEmailAddress(email)

  return users.find((user) => {
    if (typeof user.email !== 'string') {
      return false
    }

    return normalizeEmailAddress(user.email) === normalizedEmail
  }) ?? null
}
