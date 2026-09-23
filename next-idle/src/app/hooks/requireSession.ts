"use client"

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation'

export function requireSession() {

  const { update, data, status } = useSession();
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push('/auth/signin');
    }
  }, [status]);

    return { update, data, status };
}