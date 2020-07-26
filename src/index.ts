import { x } from "./xray";
import { scrapeBundestagStart } from "./bundestag";
import "node-json-color-stringify";
import { ObjWithLinks } from "./types";
import { emitter } from "./events";

export const start = async () => {
  const res = await x(`http://dipbt.bundestag.de/extrakt/`, {
    links: x("a.linkIntern", [
      {
        text: "@text | trim",
        url: "@href",
      },
    ]),
  }).then(async (result: ObjWithLinks) => {
    return await result.links.reduce(async (prev, link) => {
      switch (link.text) {
        case "Beratungsabläufe":
          return { ...prev, [link.text]: await scrapeBundestagStart(link.url) };
        default:
          return prev;
      }
    }, {});
  });
};
