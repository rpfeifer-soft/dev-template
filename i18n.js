import InitCmd from "ttag-cli/dist/src/commands/init.js";
import CheckCmd from "ttag-cli/dist/src/commands/check.js";
import UpdateCmd from "ttag-cli/dist/src/commands/update.js";
import WebCmd from "ttag-cli/dist/src/commands/web.js";
import parser_1 from "ttag-cli/dist/src//lib/parser.js";
import utils_1 from "ttag-cli/dist/src//lib/utils.js";
import fs from "fs";
import glob from "glob";
import yargs from "yargs";

var __values =
   (this && this.__values) ||
   function (o) {
      var s = typeof Symbol === "function" && Symbol.iterator,
         m = s && o[s],
         i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number")
         return {
            next: function () {
               if (o && i >= o.length) o = void 0;
               return { value: o && o[i++], done: !o };
            },
         };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
   };

function po2json(lang, path, pretty, nostrip, format) {
   var e_1, _a;
   if (!fs.existsSync(path)) {
      const init = InitCmd.default;
      init(lang, path);
   }
   var poData = parser_1.parse(fs.readFileSync(path).toString());
   var messages = utils_1.iterateTranslations(poData.translations);
   if (!nostrip) {
      var header = messages.next().value;
      delete header.comments;
      try {
         for (
            var messages_1 = __values(messages), messages_1_1 = messages_1.next();
            !messages_1_1.done;
            messages_1_1 = messages_1.next()
         ) {
            var msg = messages_1_1.value;
            delete msg.comments;
         }
      } catch (e_1_1) {
         e_1 = { error: e_1_1 };
      } finally {
         try {
            if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
         } finally {
            if (e_1) throw e_1.error;
         }
      }
   }
   if (format === "compact") {
      poData = utils_1.convert2Compact(poData);
   }
   return JSON.stringify(poData, null, pretty ? 2 : 0);
}

let options = {
   discover: ["t", "ngettext"],
   numberedExpressions: true,
   sortByMsgid: true,
   addComments: "translate:",
};

function poFile(lang) {
   return "src/shared/i18n/" + lang + ".po";
}

function tsFile(lang) {
   return "src/shared/i18n/" + lang + ".ts";
}

function handleFiles(fct) {
   glob("./src/**/!(i18n)/*.ts?(x)", function (er, files) {
      fct(files);
   });
}

function check(lang) {
   handleFiles((files) => {
      CheckCmd.default(poFile(lang), files, lang, options);
   });
}

function update(lang) {
   handleFiles((files) => {
      UpdateCmd.default(poFile(lang), files, lang, options);

      fs.writeFile(
         tsFile(lang),
         `export const locale: any = 
          ${po2json(lang, poFile(lang), false, false, "compact")};`,
         function (err) {
            if (err) {
               throw err;
            }
         }
      );
   });
}

function translate(lang) {
   WebCmd.default(poFile(lang));
}

// Analyze
let args = yargs(process.argv.slice(2))
   .command("check", "Check whether the translations are complete!")
   .command("update", "Update the translations!")
   .command("translate", "Translate the text by opening the web-app!")
   .demandCommand(1)
   .help()
   .alias("help", "h").argv;

switch (args._[0]) {
   case "check":
      check("en");
      break;

   case "update":
      update("en");
      break;

   case "translate":
      translate("en");
      break;
}
