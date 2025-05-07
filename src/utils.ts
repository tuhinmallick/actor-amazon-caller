import { Input } from "./types.js";
import { Actor, log } from "apify";
import { DownloadItemsFormat } from "apify-client";
import axios from "axios";

//Creating the API client
export const useApiApifyClient = async (input: Input) => {
    log.info("Starting working with ApifyClient");
    const client = Actor.newClient();

    //update the memory on the Actor
    const task = client.task("2ij2gVoM0mrZg4Dmd");

    await task.update({
        options: { memoryMbytes: input.memory },
    });

    const { id } = await task.call();
    const dataset = client.run(id).dataset();

    const items = await dataset.downloadItems(DownloadItemsFormat.CSV, {
        limit: input.maxItems,
        fields: input.fields,
    });

    log.info("Finished the scrapinga got dataset. Saving as CSV...");
    return Actor.setValue("OUTPUT", items, { contentType: "text/csv" });
};

//Doing raw API requests
export const useApifyApi = async (input: Input) => {
    log.info("Starting working with ApifyApi");
    const taskId = "2ij2gVoM0mrZg4Dmd";

    const token = process.env.APIFY_TOKEN;
    if (!token) throw new Error("APIFY_TOKEN is not defined.");

    const startRes = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${taskId}/runs`,
        {
            memory: input.memory,
            token,
        },
    );

    const runId = startRes.data.data.id;

    //Poll status
    let status = "RUNNING";
    let runResult;

    while (status === "RUNNING" || status === "READY") {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 seconds

        const pollRes = await axios.get(
            `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`,
        );

        runResult = pollRes.data.data;
        status = runResult.status;
    }

    if (status !== "SUCCEEDED") {
        throw new Error(`Actor run failed with status: ${status}`);
    }

    const datasetId = runResult.defaultDatasetId;

    //Get the dataset items
    const datasetUrl = new URL(
        `https://api.apify.com/v2/datasets/${datasetId}/items`,
    );

    datasetUrl.search = new URLSearchParams({
        token,
        format: "csv",
        limit: input.maxItems.toString(),
        fields: input.fields.join(","),
    }).toString();

    const { data } = await axios.get(datasetUrl.toString());

    log.info("Finished the scrapinga got dataset. Saving as CSV...");
    return Actor.setValue("OUTPUT", data, { contentType: "text/csv" });
};

//Validating the input
export function validateInput(
    inputObject: Input | null,
): asserts inputObject is Input {
    if (
        !inputObject ||
        typeof inputObject.useClient !== "boolean" ||
        !Array.isArray(inputObject.fields) ||
        inputObject.fields.length === 0
    ) {
        Actor.fail(
            "Input is invalid. useClient or fields are missing or invalid.",
        );
        throw new Error(
            "Input is invalid. useClient or fields are missing or invalid.",
        );
    }

    log.info("Input is valid, proceeding");
}
