import Xray from "x-ray";
var x = Xray({
  filters: {
    trim: (value) => {
      return typeof value === "string"
        ? value.trim().replace(/[\n\t\r]/g, "")
        : value;
    },
    trimSimple: (value) => {
      return typeof value === "string" ? value.trim() : value;
    },
    addDomain: (value) => {
      return typeof value === "string" ? `https://bundestag.de${value}` : value;
    },
  },
})
  .concurrency(20)
  .timeout(30 * 1000);

export { x };
