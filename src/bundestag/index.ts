import { x } from "../xray";
import { Link, DrucksacheBase } from "../types";
import X2JS from "x2js";
import { emitter } from "../events";
import { config } from "../config";
import { reduce } from "p-iteration";

const x2j = new X2JS();

export const scrapeBundestagStart = async (url: string) => {
  console.info("scrapeBundestagStart");
  return await x(url, "a.linkIntern", [
    {
      text: "@text",
      url: "@href",
    },
  ]).then(async (result: Link[]) => {
    return reduce(
      result,
      async (prev, { text, url }) => {
        const period = parseInt(text.substr(2), 10);
        console.log({ period });
        if (config.perios.length === 0 || config.perios.includes(period)) {
          return {
            ...prev,
            [text]: await scrapeDrucksachen(url, period),
          };
        }
        return prev;
      },
      {}
    );
    // return result.reduce(async (prev, { text, url }) => {
    //   const period = parseInt(text.substr(2), 10);
    //   console.log({ period });
    //   if (config.perios.length === 0 || config.perios.includes(period)) {
    //     return {
    //       ...prev,
    //       [text]: await scrapeDrucksachen(url, period),
    //     };
    //   }
    //   return prev;
    // }, {});
  });
};

const scrapeDrucksachen = async (url: string, period: number) => {
  console.info("scrapeDrucksachen");
  return await x(url, "table tbody tr", [
    {
      type: "td:nth-child(1)",
      title: "td:nth-child(2) a@text",
      url: "td:nth-child(2) a@href",
      date: "td:nth-child(3)",
    },
  ]).then(async (result: DrucksacheBase[]) => {
    return await Promise.all(
      result
        .filter(({ type }) =>
          config.types.length > 0 ? config.types.includes(type) : true
        )
        .map(async (drs) => {
          return scrapeDrucksacheDetail({ ...drs, period });
        })
    );
  });
};

const scrapeDrucksacheDetail = async (
  drs: DrucksacheBase,
  { retryCount = 0 }: { retryCount?: number } = {}
) => {
  let url = drs.url;
  let procedureId: string;
  if (drs.url.indexOf("dip21.web") !== -1) {
    const regexpProcedureId = new RegExp("selId=(?<procedureId>\\d*)");
    const match = regexpProcedureId.exec(drs.url);
    procedureId = match?.groups?.procedureId as string;
    if (procedureId) {
      url = `http://dipbt.bundestag.de/extrakt/ba/WP${
        drs.period
      }/${procedureId.substring(
        0,
        procedureId.length === 5 ? 3 : 4
      )}/${procedureId}.html`;
    } else {
      throw new Error("procedureId not matched");
    }
  } else {
    const regexpProcedureId = new RegExp("(?<procedureId>\\d*).html$");
    const match = regexpProcedureId.exec(drs.url);
    procedureId = match?.groups?.procedureId as string;
  }
  try {
    return await x(url, {
      html: "body@html",
    }).then(async (detail) => {
      process.stdout.write("D");
      const regexpXml = new RegExp(
        "<!-- START PARSE  -->.*?<!--(?<xml>.*?)-->",
        "gms"
      );
      const match = regexpXml.exec(detail.html);
      const xml = match?.groups?.xml;
      let xmlJson = {};
      if (xml) {
        xmlJson = x2j.xml2js(xml);
      }
      const data = { ...drs, procedureId, url, data: xmlJson };
      emitter.emit("procedure", data);
      return data;
    });
  } catch (error) {
    if (retryCount < 5) {
      process.stdout.write(`#R-${retryCount}-${procedureId}#`);
      scrapeDrucksacheDetail(drs, { retryCount: retryCount + 1 });
    } else {
      throw new Error("retry limit reached");
    }
  }
};
