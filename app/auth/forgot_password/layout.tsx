import * as React from "react";

import { type Metadata } from "next";

import { PATHS, PATHS_MAP } from "@/constants";

export const metadata: Metadata = {
  title: PATHS_MAP[PATHS.AUTH_FORGOT_PASSWORD],
};

export default function Layout({ children }: React.PropsWithChildren) {
  return <>{children}</>;
} 