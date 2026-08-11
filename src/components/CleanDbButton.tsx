"use server";

import { clearDatabaseAction } from "@/actions/admin.actions";
import { Trash2 } from "lucide-react";
import CleanDbClientButton from "./CleanDbClientButton";

export default async function CleanDbButton() {
  return <CleanDbClientButton action={clearDatabaseAction} />;
}
