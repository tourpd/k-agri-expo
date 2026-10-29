export type KagriEntityType =
  | "USER"
  | "FARMER"
  | "FARM"
  | "CROP"
  | "PROBLEM"
  | "KNOWLEDGE"
  | "CONTENT"
  | "SHOOT"
  | "VENDOR"
  | "BOOTH"
  | "PRODUCT"
  | "BUYER"
  | "DEMAND"
  | "LEAD"
  | "ORDER"
  | "OUTCOME";

export type KagriSourceSystem =
  | "kagri"
  | "expo"
  | "photodoctor"
  | "jopd"
  | "farmer"
  | "buyer"
  | "crm"
  | "knowledge"
  | "legacy";

export type KagriSourceRef = {
  sourceSystem: KagriSourceSystem;
  sourceTable: string;
  sourceId: string;
};

export type KagriEntityRef = KagriSourceRef & {
  entityType: KagriEntityType;
  canonicalId?: string;
};

export type KagriAdapterRecord<T> = {
  entity: KagriEntityRef;
  data: T;
};
