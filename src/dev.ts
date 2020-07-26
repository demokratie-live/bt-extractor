import { emitter } from "./events";
import { config } from "./config";
import fs from "fs";
import path from "path";
import { start } from ".";

const onProcedure = (data: any) => {
  const filePath = `../files/${data.period}/${(data.type as string).replace(
    "/",
    ", "
  )}/${data.procedureId}.json`;
  ensureDirectoryExistence(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data.data, null, 4));
};

(async () => {
  emitter.on("procedure", onProcedure);
  config.types = ["Gesetzgebung", "Antrag"];
  config.perios = [19];
  const data = await start().catch(console.error);
  fs.writeFileSync("../data.json", JSON.stringify(data, null, 4));
})();

const ensureDirectoryExistence = (filePath: string) => {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
};
