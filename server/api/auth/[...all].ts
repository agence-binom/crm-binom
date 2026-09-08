import { toWebRequest } from 'h3'
import { auth } from '~~/server/lib/better-auth'

export default defineEventHandler(event => auth.handler(toWebRequest(event)))
