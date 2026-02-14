'use server';

import { signOut as workosSignOut } from '@workos-inc/authkit-nextjs';

export async function signOut() {
  await workosSignOut();
}
