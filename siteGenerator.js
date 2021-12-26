// @ts-check

const fs = require("fs");
const date = require("date-and-time");

/** @type {Object.<string, string>} */
let componentToContent = {};

let componentFiles = fs.readdirSync("./components");
for (const componentFile of componentFiles) {
  let componentName = componentFile.split(".")[0];
  componentToContent[componentName] = fs.readFileSync(
    `./components/${componentFile}`,
    "utf8"
  );
}

// delete build folder
if (fs.existsSync("./build")) fs.rmSync("./build", { recursive: true });

// cp src to build
fs.cpSync("./src", "./build", { recursive: true });

// go through all of build and replace {{}} things with their corresponding components
recursivelyAddComponents("./build");
fs.cpSync('./resources', './build/resources', {recursive: true})

function recursivelyAddComponents(directory) {
  let files = fs.readdirSync(directory, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile && file.name.split(".")[1] == "html") {
      //convert all occurances here
      let htmlFilePath = directory + "/" + file.name;
      let contents = fs.readFileSync(htmlFilePath, "utf8");
      for (let component in componentToContent) {
        contents = contents.replace(
          `{{${component}}}`,
          componentToContent[component]
        );
      }

      let sourceHtmlPathParts = htmlFilePath.split("/");
      sourceHtmlPathParts[1] = "src"
      const sourceHtmlPath = sourceHtmlPathParts.join("/");
      //now add last updated dates
      contents = contents.replace(
        `{{lastUpdated}}`,
        date.format( fs.statSync(sourceHtmlPath).mtime, "MMM DD YYYY" )
      );

      fs.writeFileSync(htmlFilePath, contents);
    }
    if (file.isDirectory()) {
      recursivelyAddComponents(directory + "/" + file.name);
    }
  }
}
