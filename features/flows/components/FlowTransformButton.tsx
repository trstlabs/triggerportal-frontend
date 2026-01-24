import { Flow } from 'intentojs/dist/codegen/intento/intent/v1/flow';
import { FlowInput } from '../../../types/trstTypes';
import { Button, CopyIcon } from 'components/ui-blocks';
import { fetchFlowMsgs } from '../../../hooks/useGetMsgsFromAPI';
import { convertBigIntToString } from '../../../util/conversion';

type FlowTransformButtonProps = {
    flow: any
    initialChainID?: string
}

export const FlowTransformButton = ({ flow, initialChainID }: FlowTransformButtonProps) => {


    const transformFlow = async (flow: Flow) => {
        const msgs = await transformFlowMsgs(flow)
        console.log(msgs)
        // Transform Flow to FlowInput
        const flowInput: FlowInput = {
            // Your transformation logic here
            duration: flow.endTime.getMilliseconds() - flow.startTime.getMilliseconds(),
            interval: Number(flow.interval.seconds) * 1000 + Number(flow.interval.nanos),
            msgs: msgs,
            conditions: flow.conditions,
            configuration: flow.configuration,
            connectionId: flow.selfHostedIca.connectionId,
            trustlessAgent: flow.trustlessAgent,
            label: flow.label,
            chainId: initialChainID

        };
        console.log(flowInput)
        return flowInput;

    };

    const handleClick = async () => {
        try {
            let flowInput = await transformFlow(flow);
            flowInput = convertBigIntToString(flowInput);

            const query: any = { flowInput: JSON.stringify(flowInput) };

            const url = `/build?${new URLSearchParams(query).toString()}`;

            // Open in a new tab
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (error) {
            console.error('Error transforming flow:', error);
        }
    };

    return <Button variant="secondary" iconRight={<CopyIcon color="white" />} onClick={handleClick}>Copy and Create</Button>;
};
const cleanMessageObject = (
    obj: any,
    seen = new WeakSet(),
    isInsideMsg = false
): any => {
    if (obj === null || typeof obj !== "object") return obj;

    if (seen.has(obj)) return undefined;
    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj
            .map((item) => {
                // Unwrap single-value objects in arrays (e.g., routes with only "value" key)
                if (
                    item &&
                    typeof item === "object" &&
                    "value" in item &&
                    Object.keys(item).length === 1 &&
                    !item.typeUrl // Don't unwrap if it has typeUrl (protobuf message)
                ) {
                    return cleanMessageObject(item.value, seen, isInsideMsg);
                }
                return cleanMessageObject(item, seen, isInsideMsg);
            })
            .filter((v) => v !== undefined);
    }

    // Preserve protobuf-style object with typeUrl/value
    if (obj.typeUrl && "value" in obj) {
        return {
            typeUrl: obj.typeUrl,
            value: cleanMessageObject(obj.value, seen, isInsideMsg),
        };
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;

        const isMsgKey = key === "msg";
        const recurseInsideMsg = isInsideMsg || isMsgKey;
        const newKey = recurseInsideMsg ? toSnakeCase(key) : key;

        if (
            value &&
            typeof value === "object" &&
            "value" in value &&
            Object.keys(value).length === 1
        ) {
            // Unwrap single-value object (likely protobuf-style)
            const cleaned = cleanMessageObject(
                value.value,
                seen,
                recurseInsideMsg
            );
            if (cleaned !== undefined) result[newKey] = cleaned;
        } else {
            const cleaned = cleanMessageObject(value, seen, recurseInsideMsg);
            if (cleaned !== undefined) result[newKey] = cleaned;
        }
    }

    return result;
};
export async function transformFlowMsgs(flow) {
    let msgs: string[] = [];

    try {
        const msgsObj = await fetchFlowMsgs(flow.id.toString());

        if (Array.isArray(msgsObj)) {
            msgsObj.forEach((msgObj: any, index) => {
                try {
                    // console.log("Original message:", JSON.stringify(msgObj, null, 2));

                    // First normalize amount fields
                    msgObj = normalizeAmountField(msgObj);

                    // Clean and transform the message object
                    msgObj = cleanMessageObject(msgObj);

                    // Handle MsgExecuteContract with base64 encoded msg
                    if (msgObj.typeUrl?.includes("MsgExecuteContract") &&
                        msgObj.msg && typeof msgObj.msg === 'string') {
                        try {
                            const decodedMsg = JSON.parse(
                                Buffer.from(msgObj.msg, 'base64').toString('utf-8')
                            );
                            msgObj.msg = cleanMessageObject(decodedMsg);
                        } catch (e) {
                            console.warn("Failed to decode MsgExecuteContract msg:", e);
                        }
                    }

                    // Handle nested msgs array (common in MsgExec)
                    if (Array.isArray(msgObj.msgs)) {
                        msgObj.msgs = msgObj.msgs.map((nestedMsg: any) => {
                            if (nestedMsg.typeUrl && nestedMsg.value) {
                                return {
                                    typeUrl: nestedMsg.typeUrl,
                                    ...cleanMessageObject(nestedMsg.value)
                                };
                            }
                            return cleanMessageObject(nestedMsg);
                        });
                    }

                    const msg = JSON.stringify(
                        msgObj,
                        (_, value) => (typeof value === "bigint" ? value.toString() : value),
                        2
                    );
                    // console.log("Transformed message:", msg);
                    msgs[index] = msg;
                } catch (error) {
                    console.error(`Error processing message at index ${index}:`, error);
                    // Continue with next message if one fails
                }
            });
        }
    } catch (error) {
        console.warn("Failed to fetch flow messages, continuing with empty messages array:", error);
        // Return empty array to allow the edit flow to continue
        return undefined
    }

    console.log("Final processed messages:", msgs);
    return msgs;
}

const normalizeAmountField = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    // Handle arrays recursively
    if (Array.isArray(obj)) {
        return obj.map(normalizeAmountField);
    }

    // If this object has a `value` key containing denom + amount, unwrap it
    if (
        "value" in obj &&
        typeof obj.value === "object" &&
        obj.value !== null &&
        "amount" in obj.value &&
        "denom" in obj.value
    ) {
        return {
            denom: obj.value.denom,
            amount: obj.value.amount,
        };
    }

    // Recurse through the object
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, normalizeAmountField(value)])
    );
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};
