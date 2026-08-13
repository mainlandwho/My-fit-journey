"use client";

import { useRegisterServiceWorker } from "@/lib/pwa/register-sw";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function PwaClientShell() {
  useRegisterServiceWorker();
  return <InstallPrompt />;
}
