import { fileURLToPath } from "url";
import { dirname } from "path";
export const _dirname = (dirname(fileURLToPath(import.meta.url))).replace(/\\/g, "/");