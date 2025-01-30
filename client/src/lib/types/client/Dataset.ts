import { getKeyValue } from '$lib/types/obj'; 
import type { Dataset } from "client";

export const datasetGet = (dataset: Dataset | Partial<Dataset>, key: string) => {
    // Typescript compliant get
    if (dataset) {
        return getKeyValue<keyof Dataset, Dataset | Partial<Dataset>>(key as keyof Dataset)(
            dataset
        );
    }
    return null;
}
