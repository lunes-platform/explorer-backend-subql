import { Asset } from "../types";

export async function ensureAsset(id: string): Promise<Asset> {

  let entity = await Asset.get(id);
  if (!entity) {
    const data_ = await api.query.assets.metadata(id)
    const token: any = data_.toHuman()
    entity = new Asset(id, token.name, token.symbol, token.decimals);
    await entity.save();
  }
  return entity

}