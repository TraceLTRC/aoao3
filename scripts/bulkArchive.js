import inquirer from "inquirer";
import { readFile } from 'fs/promises'
import axios from "axios";
 
const endpoint = process.env.ENDPOINT
const bearer = process.env.BEARER

let works;

await inquirer.prompt([
    {
        name: "file",
        message: "File location for work Ids to update",
        type: "input",
        default: "./workIds.json"
    }
]).then(async (answers) => {
    works = JSON.parse(
        await readFile(
            answers.file
        )
    )
})

for (let work of works) {
    try {
        const { status } = await axios.post(
            endpoint,
            { "workId": work.id },
            { headers: { Authorization: `Bearer ${bearer}` } }
        )
        console.log(`Work ID ${work.id} got code ${status}`)
    } catch (e) {
        console.error(e)
        break
    }
}