import { useDatabasePool } from '#server/utils/database'
import { requireUser } from '#server/utils/neuro-notes-auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const result = await useDatabasePool().query(
    `SELECT id, current_version AS "currentVersion", published_at AS "publishedAt", updated_at AS "updatedAt"
     FROM plugins WHERE owner_user_id = $1 ORDER BY updated_at DESC`,
    [user.id]
  )
  return { items: result.rows }
})
