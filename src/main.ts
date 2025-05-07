import { Actor, log } from "apify";
import { Input } from "./types.js";
import { validateInput, useApiApifyClient, useApifyApi } from "./utils.js";

await Actor.init();

// Getting the input
const input = await Actor.getInput<Input>();

validateInput(input);

input?.useClient ? await useApiApifyClient(input) : await useApifyApi(input);

await Actor.exit();
