const path = require("node:path");
const fs = require("node:fs").promises;
const yargs = require("yargs");
const readline = require("node:readline");

const args = yargs.alias("a", "all").argv;
const dir = path.resolve(__dirname, "../src/lang");
const enLang = path.join(dir, "en-us.json");

const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function checkDirExists() {
    try {
        await fs.access(dir);
    } catch {
        console.error("Language folder not found!");
        process.exit(1);
    }
}

async function main() {
    await checkDirExists();
    
    const list = await fs.readdir(dir);
    let command = args._[0];
    let arg = args._[1];
    let val = args._[2];

    if (args._.length > 3) {
        console.error("Invalid arguments", args._);
        process.exit(0);
    }

    if (!["add", "remove", "update", "update-key", "search", "check"].includes(command)) {
        console.error(`Missing/Invalid arguments.
use 'add' to add a new string
use 'remove' to remove a string
use 'search' to search a string
use 'update' to update a string
use 'update-key' to update a key
use 'check' to check a string`);
        process.exit();
    }

    await update(command, list, arg, val);
}

async function update(command, list, arg, val) {
    if (command === "check") {
        await checkTranslations(list, arg);
        return;
    }

    let key = arg ? arg.toLowerCase() : await getStr("string: ");
    let newKey = command === "update-key" && !val ? await getStr("new key: ") : val;

    for (const lang of list) {
        if (lang === "en-us.json") continue;
        
        const langFile = path.join(dir, lang);
        const langName = lang.split(".")[0];

        if (command === "add") {
            if (!args.a) {
                const translation = await getStr(`${langName}: `);
                await modifyLangFile(langFile, (strings) => {
                    if (key in strings) {
                        console.error("String already exists");
                        process.exit(1);
                    }
                    strings[key] = translation;
                    return strings;
                });
            } else {
                await modifyLangFile(langFile, (strings) => {
                    if (key in strings) {
                        console.error("String already exists");
                        process.exit(1);
                    }
                    strings[key] = arg;
                    return strings;
                });
            }
        } else if (command === "remove") {
            await modifyLangFile(langFile, (strings) => {
                if (key in strings) {
                    delete strings[key];
                    console.log(`Removed: ${key}`);
                } else {
                    console.error("String not exists");
                }
                return strings;
            });
        } else if (command === "update-key") {
            if (!newKey) {
                console.error("New key is required");
                process.exit(1);
            }
            await modifyLangFile(langFile, (strings) => {
                if (!(key in strings)) {
                    console.error("Key not found");
                    process.exit(1);
                }
                strings[newKey] = strings[key];
                delete strings[key];
                return strings;
            });
        } else if (command === "update") {
            const translation = val || await getStr(`${langName}: `);
            await modifyLangFile(langFile, (strings) => {
                strings[key] = translation;
                return strings;
            });
        } else if (command === "search") {
            const strings = JSON.parse(await fs.readFile(langFile, "utf-8"));
            if (key in strings) console.log(`${key} (${langName}): ${strings[key]}`);
            else console.log(`${key} not exists`);
        }
    }
}

async function checkTranslations(list, fix) {
    try {
        const enLangData = JSON.parse(await fs.readFile(enLang, "utf-8"));
        let hasErrors = false;
        let fixedCount = 0;

        for (const file of list) {
            if (file === "en-us.json") continue;

            const langFile = path.join(dir, file);
            const langData = JSON.parse(await fs.readFile(langFile, "utf-8"));
            let fileHasErrors = false;

            for (const enKey in enLangData) {
                if (!(enKey in langData)) {
                    if (!fileHasErrors) {
                        console.log(`\n-------------- ${file}`);
                        fileHasErrors = true;
                        hasErrors = true;
                    }
                    console.log(`Missing: ${enKey} ${fix ? "✔" : ""}`);
                    if (fix) langData[enKey] = enLangData[enKey];
                }
            }

            if (fileHasErrors && fix) {
                await fs.writeFile(langFile, JSON.stringify(langData, null, 2));
                fixedCount++;
            }
        }

        if (!hasErrors) console.log("\nGOOD NEWS! No Error Found\n");
        else if (fix) console.log(`\nFixed ${fixedCount} files.\n`);
    } catch (err) {
        console.error("Error checking translations:", err);
        process.exit(1);
    }
}

async function modifyLangFile(filePath, modify) {
    try {
        const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
        const newData = modify(data);
        if (newData && typeof newData === "object") {
            await fs.writeFile(filePath, JSON.stringify(newData, null, 2));
        } else {
            console.error(`Modification function did not return valid JSON for ${filePath}`);
            process.exit(1);
        }
    } catch (err) {
        console.error(`Error modifying ${filePath}:`, err);
        process.exit(1);
    }
}

function getStr(question) {
    return new Promise((resolve) => {
        read.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

main();
