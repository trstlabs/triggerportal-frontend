
// import Ajv, { ErrorObject } from "ajv-draft-04"
import { Text } from "components/ui-blocks"
import * as cosmosMsgsJsonFiles from '../../../../util/scripts/schemas/msgs'
import * as yup from 'yup';

interface ErrorStackProps {
    validationErrors: string[]
}

export const ErrorStack = ({ validationErrors }: ErrorStackProps) => {
    //const parsedJSON =  JSON.parse(jsonMsg)
    return <ul>
        {validationErrors.map((error) => (
            error != "" ? <Text css={{ margin: "$4" }} variant="caption" key={error}>
                ❌ {error}
            </Text> :
                <Text css={{ margin: "$4" }} variant="caption" key={error} >
                    {/*  ✅ Valid Cosmos message structure */}
                </Text >
        ))}
    </ul >
}


// Custom method to add to yup for additional validation
// yup.addMethod(yup.string, 'binary', function () {
//     return this.test('binary', 'Invalid binary format', (value) => {
//         // Implement your binary format check logic here
//         return true;
//     });
// });

// Define your yup schema based on your JSON schema
const createYupSchema = (jsonSchema: any) => {
    const shape: Record<string, any> = {};

    // Convert your JSON schema properties to yup validations here
    // This example is simplistic; you might need a more complex conversion
    for (const key in jsonSchema.properties) {
        switch (jsonSchema.properties[key].type) {
            case 'string':
                shape[key] = yup.string();
                break;
            case 'number':
                shape[key] = yup.number();
                break;
            case 'boolean':
                shape[key] = yup.boolean();
                break;
            case 'object':
                shape[key] = yup.object();
                break;
            case 'array':
                shape[key] = yup.array();
                break;
            default:
                shape[key] = yup.mixed();
        }
    }

    return yup.object().shape(shape);
};

export const validateJSON = (jsonData: any, jsonSchema: any): Array<string> => {
    let errors: string[] = [];

    if (jsonData['typeUrl']) {
        const foundTypeUrl = hasRegisteredMsg(jsonData['typeUrl']);
        if (!foundTypeUrl) {
            errors.push("TypeUrl cannot be found and is not registered");
        }
    }

    let amount = deepSearchAmount(jsonData, "amount");
    if (amount) {
        if (isNaN(Number(amount))) {
            errors.push("amount is not a number");
        }
    }

    const yupSchema = createYupSchema(jsonSchema);

    try {
        yupSchema.validateSync(jsonData['value'], { abortEarly: false });
    } catch (validationError) {
        if (validationError instanceof yup.ValidationError) {
            errors.push(...validationError.errors);
        }
    }

    return errors;
};

function deepSearchAmount(obj: any, targetProperty: string): any | undefined {
    if (typeof obj === 'object' && obj !== null) {
        if (obj.hasOwnProperty(targetProperty) && typeof obj[targetProperty] === 'string') {
            return obj[targetProperty]

        } else {
            for (const key in obj) {
                const result = deepSearchAmount(obj[key], targetProperty)
                if (result !== undefined) {

                    return result
                }
            }
        }
    }
    return undefined
}


// // Function to extract error messages
// export function extractErrorMessages(errors: Array<ErrorObject>): Array<string> {
//     return errors.map(error => {
//         console.log(error)


//         if (error.keyword == "additionalProperties" || error.params.additionalProperty != "amount" || error.params.additionalProperty != "denom ") {
//             // if ((error.instancePath == '/amount' || error.instancePath.includes("grant"))) {
//             return
//             // }
//             // return `Error at ${error.instancePath}, you have defined fields that are not valid for this Cosmos messsage`
//         }

//         if (error.instancePath.length == 0) {
//             return `Make sure the 'value' object is present and the spelling is correct`
//         }
//         return error.message ? `Error at ${error.instancePath}: Validation failed for ${error.keyword}: ${error.message}` : error.keyword
//         // Construct a meaningful message for each error
//         // If `message` is not defined, use a default message

//     });
// }


// Helper function to find and return a file by name
export function findFileBySuffix(typeUrlSuffix: string): any | undefined {
    for (const key in cosmosMsgsJsonFiles) {
        ///TODO there may be identical messages so at some point it may suffice to add more controls for msg
        if (
            Object.prototype.hasOwnProperty.call(cosmosMsgsJsonFiles, key) &&
            key.includes(typeUrlSuffix)
        ) {
            return cosmosMsgsJsonFiles[key]
        }
    }
    return undefined
}

// Helper function to find a file by name
export function hasRegisteredMsg(typeUrl: string): boolean {
    for (const key in cosmosMsgsJsonFiles) {
        if (key.replaceAll('_', '.') == typeUrl.slice(1)) {
            return true
        }
    }
    return false
}


export function customValidate(_formData, errors) {
    // console.log(formData)
    // try {

    //     const amount = formData.find(key => key == "denom")
    //     if (amount) {
    //         alert("hji")
    //     }
    // } catch (e) {
    //    console.log(e)
    // }
    return errors;
}