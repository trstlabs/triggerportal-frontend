import { Text, Tooltip, Button, UnionIcon, Divider } from "components/ui-blocks";
import { Field } from "./Fields";
import { ICQConfig } from "intentojs/dist/codegen/intento/intent/v1/flow";
import Dropdown from "./Dropdown";
import { TimeoutPolicy } from "intentojs/dist/codegen/stride/interchainquery/v1/genesis";
import { ChainSelector } from "../ChainSelector/ChainSelector";
import { useState } from "react";
import * as bech32 from "bech32";
import { Duration } from "intentojs/dist/codegen/google/protobuf/duration";
import { Chip } from "../../../../components/Layout/Chip";
import { fromBech32, toUtf8 } from '@cosmjs/encoding'

type ICQConfigProps = {
  icqConfig?: ICQConfig;
  onChange: (value: ICQConfig) => void;
  setDisabled: () => void
};

export const ICQConfigForm = ({ icqConfig, onChange, setDisabled }: ICQConfigProps) => {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...icqConfig });

  const handleFieldsChange = (updatedFields: Partial<ICQConfig>) => {
    const newValue = { ...formData, ...updatedFields }; // Merge the existing form data with the new values
    setFormData(newValue); // Update the local state
    onChange(newValue); // Call the onChange prop with the new values
  };
  const emptyFields = () => {
    onChange(undefined)
    setDisabled()
  }

  const handleFieldChange = (field: string, value: any) => {
    const newValue = { ...formData, [field]: value };
    setFormData(newValue);
    onChange(newValue);
  };

  const examples = {
    "Bank Balance Query": {
      queryType: "store/bank/key",
      fields: [{ label: "Address", key: "address" }, { label: "Denom", key: "denom" }],
      queryKey: (data: { address: string, denom: string }) => createBankBalanceQueryKey(data.address, data.denom),
    },
    "Staking Validator Query": {
      queryType: "store/staking/key",
      fields: [
        { label: "Delegator Address", key: "delegatorAddress" },
        { label: "Validator Address", key: "validatorAddress" },
      ],
      queryKey: (data: { delegatorAddress: string; validatorAddress: string }) =>
        createStakingDelegationQueryKey(data.delegatorAddress, data.validatorAddress),
    },
    "Osmosis TWAP Query": {
      queryType: "store/twap/key",
      fields: [
        { label: "Pool ID", key: "poolId" },
        { label: "Denom 1", key: "denom1" },
        { label: "Denom 2", key: "denom2" },
      ],
      queryKey: (data: { poolId: string; denom1: string; denom2: string }) =>
        createOsmosisTwapQueryKey(parseInt(data.poolId), data.denom1, data.denom2),
    },
    "CosmWasm Item Query": {
      queryType: "store/wasm/key",
      fields: [
        { label: "Contract Address", key: "contractAddress" },
        { label: "Item Key", key: "itemKey" },
      ],
      queryKey: (data: { contractAddress: string; itemKey: string }) =>
        createCosmwasmItemQueryKey(data.contractAddress, data.itemKey),
    },
    "CosmWasm Map Query": {
      queryType: "store/wasm/key",
      fields: [
        { label: "Contract Address", key: "contractAddress" },
        { label: "Map Prefix", key: "mapPrefix" },
        { label: "Map Key", key: "mapKey" },
      ],
      queryKey: (data: { contractAddress: string; mapPrefix: string; mapKey: string }) =>
        createCosmwasmMapQueryKey(data.contractAddress, data.mapPrefix, Number(data.mapKey)),
    },
  };
  const handleExampleSelect = (example: string) => {
    const exampleConfig = examples[example];
    if (exampleConfig) {
      setSelectedExample(example);

      handleFieldsChange({ queryType: exampleConfig.queryType });
      // Reset input fields based on the example selected
      const resetData = {};
      exampleConfig.fields.forEach((field) => {
        resetData[field.key] = "";
      });
      setFormData({ ...formData, ...resetData });
    }
  };

  const generateQuery = () => {
    if (selectedExample && examples[selectedExample]) {
      const exampleConfig = examples[selectedExample];
      const queryData: { [key: string]: string } = {};

      exampleConfig.fields.forEach((field) => {
        queryData[field.key] = formData[field.key] || "";
      });

      // Generate and set the query key
      const queryKey = exampleConfig.queryKey(queryData as any);

      if (queryKey) {
        console.log(queryKey);
        handleFieldsChange({
          queryKey: queryKey,
          queryType: exampleConfig.queryType,
        });
      }
      console.log(formData);
    }
  };

  const createBankBalanceQueryKey = (address: string, denom: string): string => {
    try {
      // Decode the Bech32 address into bytes
      const { words } = bech32.decode(address);
      const addressBytes = new Uint8Array(bech32.fromWords(words));
      const addressLength = new Uint8Array([addressBytes.length]);

      // Prefix used for bank queries
      const prefix = new Uint8Array([0x02]);

      // Convert the denomination string to a Uint8Array
      const denomBytes = new TextEncoder().encode(denom);

      // Create the full query key buffer
      const queryData = new Uint8Array(prefix.length + addressLength.length + addressBytes.length + denomBytes.length);

      // Set the prefix, address bytes, and denomination bytes
      queryData.set(prefix);
      queryData.set(addressLength, prefix.length);
      queryData.set(addressBytes, addressLength.length + prefix.length);
      queryData.set(denomBytes, addressLength.length + prefix.length + addressBytes.length);

      // Encode the buffer into Base64 for the query key
      return btoa(String.fromCharCode(...queryData));
    } catch (error) {
      console.error("Error decoding Bech32 address: ", error);
      return "";
    }
  };


  const createStakingDelegationQueryKey = (delegatorAddress: string, validatorAddress: string): string => {
    try {
      const delegatorBytes = new Uint8Array(bech32.fromWords(bech32.decode(delegatorAddress).words));
      const validatorBytes = new Uint8Array(bech32.fromWords(bech32.decode(validatorAddress).words));

      const prefix = new Uint8Array([0x31]);
      const queryData = new Uint8Array(prefix.length + delegatorBytes.length + 1 + validatorBytes.length);

      queryData.set(prefix);
      queryData.set(delegatorBytes, prefix.length);
      queryData.set([validatorBytes.length], prefix.length + delegatorBytes.length);
      queryData.set(validatorBytes, prefix.length + delegatorBytes.length + 1);

      return btoa(String.fromCharCode(...queryData));
    } catch (error) {
      console.error("Error decoding Bech32 addresses: ", error);
      return "";
    }
  };

  const WASM_STORE_PREFIX = Uint8Array.from([0x03]);

  const createCosmwasmItemQueryKey = (contractAddr: string, itemKey: string): string => {
    const { data: address } = fromBech32(contractAddr);

    const addrBytes = address;
    const keyBytes = toUtf8(itemKey);

    const fullKey = new Uint8Array(WASM_STORE_PREFIX.length + addrBytes.length + keyBytes.length);
    fullKey.set(WASM_STORE_PREFIX, 0);
    fullKey.set(addrBytes, WASM_STORE_PREFIX.length);
    fullKey.set(keyBytes, WASM_STORE_PREFIX.length + addrBytes.length);

    return Buffer.from(fullKey).toString("base64");
  }



  function createCosmwasmMapQueryKey(
    contractAddr: string,
    namespace: string,
    key: number | bigint
  ): string {
    const { data: addrBytes } = fromBech32(contractAddr);
    const mapKey = createMapKey(namespace, key);

    const fullKey = new Uint8Array(WASM_STORE_PREFIX.length + addrBytes.length + mapKey.length);
    fullKey.set(WASM_STORE_PREFIX, 0);
    fullKey.set(addrBytes, WASM_STORE_PREFIX.length);
    fullKey.set(mapKey, WASM_STORE_PREFIX.length + addrBytes.length);

    return addBase64Padding(Buffer.from(fullKey).toString("base64"));
  }



  function encodeU64BE(value: number | bigint): Uint8Array {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(value));
    return new Uint8Array(buf);
  }

  function createMapKey(namespace: string, key: number | bigint): Uint8Array {
    const nsBytes = toUtf8(namespace);
    if (nsBytes.length > 255) throw new Error("Namespace too long");

    // 0x00 + len + ns + u64 BE
    const out = new Uint8Array(1 + 1 + nsBytes.length + 8);
    out[0] = 0x00; // hardcoded prefix used by cw-storage-plus
    out[1] = nsBytes.length;
    out.set(nsBytes, 2);
    out.set(encodeU64BE(key), 2 + nsBytes.length);

    return out
  }

  function addBase64Padding(str: string): string {
    while (str.length % 4 !== 0) {
      str += "=";
    }
    return str;
  }


  return (
    <>
      <Divider offsetTop="$10" offsetBottom="$5" />
      <Tooltip label={"Perform an interchain query for conditions"}>
        <Text variant="header" color="secondary" align="center" css={{ marginBottom: "$2", marginTop: "$12" }}>
          Interchain Query
        </Text>
      </Tooltip>
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <Button
          variant="ghost"
          size="small"
          iconLeft={<UnionIcon />}
          onClick={() => emptyFields()}
        >Discard
        </Button>
      </div>
      <ChainSelector
        initialChainId={formData.chainId}
        onChange={(update) => {
          handleFieldsChange({ chainId: update.chainId, connectionId: update.connectionId });
        }}
      />
      <div style={{ margin: "12px" }}>
        <div style={{ margin: "$6" }}>
          <Text variant="caption" color="secondary">Examples</Text>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            {Object.keys(examples).map((example) => (
              <Chip key={example} label={example} onClick={() => handleExampleSelect(example)} />
            ))}
          </div>

          {/* Dynamically render fields based on the selected query example */}
          {selectedExample && examples[selectedExample]?.fields?.map((field, index) => (
            <Field
              key={index}
              label={field.label}
              tooltip={`Provide the ${field.label.toLowerCase()} for the ${selectedExample}`}
              type="string"
              value={formData[field.key] || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={false}
            />
          ))}
          <Button
            variant="primary"
            onClick={generateQuery}
            disabled={!selectedExample}
            css={{ marginTop: "16px" }}
          >
            Generate Key
          </Button>
        </div>

        <Field
          label="Query Type"
          tooltip="path to the store, e.g. store/bank/key or store/staking/key"
          type="string"
          value={formData.queryType || ""}
          onChange={(e) => handleFieldsChange({ queryType: e.target.value })}
        />

        <Field
          label="Query Key"
          tooltip="key in the store to query e.g. Base64 encoded value based on prefix and address"
          value={formData.queryKey || ""}
          onChange={(e) => handleFieldsChange({ queryKey: e.target.value })}
          type="string"
        />

        <Dropdown
          label="Timeout"
          tooltip="What should happen when the query times out"
          value={formData.timeoutPolicy ? formData.timeoutPolicy : TimeoutPolicy.REJECT_QUERY_RESPONSE}
          onChange={(e) => {
            handleFieldsChange({
              timeoutPolicy: Number(e.target.value),
              timeoutDuration: Duration.fromPartial({ "seconds": BigInt(60) }),
            });
          }}
          disabled={false}
          options={TimeoutPolicyLabels}
        />
      </div>
    </>
  );
};

// Map enum values to human-readable labels
const TimeoutPolicyLabels: { [key in TimeoutPolicy]: string } = {
  [TimeoutPolicy.REJECT_QUERY_RESPONSE]: "Reject Response",
  [TimeoutPolicy.EXECUTE_QUERY_CALLBACK]: "Execute Flow",
  [TimeoutPolicy.UNRECOGNIZED]: "",
  [TimeoutPolicy.RETRY_QUERY_REQUEST]: "Retry Once",
};


export const createOsmosisTwapQueryKey = (poolId: number, denom1: string, denom2: string): string => {
  try {
    // Sort denominations
    if (denom1 > denom2) {
      [denom1, denom2] = [denom2, denom1];
    }

    const poolIdBz = poolId.toString().padStart(20, "0");
    const prefix = "recent_twap|";
    const queryKey = `${prefix}${poolIdBz}|${denom1}|${denom2}`;

    return btoa(queryKey);
  } catch (error) {
    console.error("Error generating Osmosis TWAP query key: ", error);
    return "";
  }
};