import { Asset } from "../types";

export async function ensureAsset(id: string): Promise<Asset> {
  let entity = await Asset.get(id);
  if (!entity) {
    // Create placeholder — NO RPC calls for speed.
    // Real metadata is populated by assets.MetadataSet event handler.
    entity = new Asset(id, "Native");
    entity.name = `Asset #${id}`;
    entity.symbol = `AST${id}`;
    entity.decimals = 0;
    await entity.save();
  }
  return entity;
}