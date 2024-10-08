// This is an example of to protect an API route
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (session) {
    return res.send({
      content:
        "Please enter your identity card number.",
    })
  }

  res.send({
    error: "You must be signed in to view the protected content on this page.",
  })
}
