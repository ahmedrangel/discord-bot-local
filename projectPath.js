import { fileURLToPath } from "url";
import { dirname } from "path";
const _dirname = (dirname(fileURLToPath(import.meta.url))).replace(/\\/g, "/");

export default _dirname;